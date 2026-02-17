import { assign, sortBy } from "min-dash";
import { getBusinessObject, is } from "../../util/Util";
import {
  getExternalLabelMid,
  existsExternalLabel,
  isLabel,
  requiresExternalLabel,
  getLabel,
  DEFAULT_LABEL_SIZE,
  buildAssociationLabelId,
  getLabelAttribute,
} from "../LabelUtil";
import {
  getLabelAdjustment,
  getSourceLabelPosition,
  getTargetLabelPosition,
} from "./util/LabelLayoutUtil";
import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import { getNewAttachPoint } from "diagram-js/lib/util/AttachUtil";
import { getMid, roundPoint } from "diagram-js/lib/layout/LayoutUtil";
import { delta } from "diagram-js/lib/util/PositionUtil";
import { getDistancePointLine, perpendicularFoot } from "./util/GeometricUtil";
import { ASSOCIATION_TYPES, MODELER_PREFIX } from "../../util/constants";

const NAME_PROPERTY = "name";

const DEFAULT_MULTIPLICITY = "*";

/**
 * A component that makes sure that external labels are added
 * together with respective elements and properly updated (DI wise)
 * during move.
 */
export default class LabelBehavior extends CommandInterceptor {
  constructor(eventBus, modeling, customElementFactory, textRenderer) {
    super(eventBus);

    this._modeling = modeling;
    this._customElementFactory = customElementFactory;
    this._textRenderer = textRenderer;

    // Maintain a reference to the original this object
    const self = this;

    // update label if name property was updated
    this.postExecute("element.updateProperties", function (e) {
      const context = e.context;
      const element = context.element;
      const properties = context.properties;

      if (NAME_PROPERTY in properties) {
        modeling.updateLabel(element, properties[NAME_PROPERTY]);
      }

      if (is(element, `${MODELER_PREFIX}:Association`)) {
        if ("associationType" in properties) {
          const businessObject = element.businessObject;
          for (let labelAttribute of [
            "sourceMultiplicity",
            "targetMultiplicity",
          ]) {
            if (
              [
                ASSOCIATION_TYPES.STANDARD,
                ASSOCIATION_TYPES.AGGREGATION,
                ASSOCIATION_TYPES.COMPOSITION,
              ].includes(properties["associationType"])
            ) {
              // If we switch away from generalization, we need to (re-)create the targetMultiplicity label
              const labelIdToCreate = buildAssociationLabelId(
                businessObject.id,
                labelAttribute,
              );
              if (!element.labels.find((l) => l.id === labelIdToCreate)) {
                businessObject.labelAttribute = labelAttribute;

                let labelCenter;
                if (labelAttribute === "sourceMultiplicity") {
                  labelCenter = getSourceLabelPosition(element);
                  businessObject.sourceMultiplicity = DEFAULT_MULTIPLICITY;
                } else if (labelAttribute === "targetMultiplicity") {
                  labelCenter = getTargetLabelPosition(element);
                  businessObject.targetMultiplicity = DEFAULT_MULTIPLICITY;
                }

                const labelDimensions = textRenderer.getExternalLabelBounds(
                  DEFAULT_LABEL_SIZE,
                  DEFAULT_MULTIPLICITY,
                );
                modeling.createLabel(element, labelCenter, {
                  id: buildAssociationLabelId(
                    businessObject.id,
                    labelAttribute,
                  ),
                  labelAttribute,
                  businessObject,
                  width: labelDimensions.width,
                  height: labelDimensions.height,
                });
              }
            } else if (
              properties["associationType"] === ASSOCIATION_TYPES.GENERALIZATION
            ) {
              // If we switch to generalization, we need to remove the multiplicity labels
              const labelIdToRemove = buildAssociationLabelId(
                businessObject.id,
                labelAttribute,
              );
              const labelToRemove = element.labels.find(
                (l) => l.id === labelIdToRemove,
              );
              if (labelToRemove) {
                modeling.removeElements([labelToRemove]);
              }
            }
          }
        }
      }
    });

    // create label shape after shape/connection was created
    this.postExecute(["shape.create", "connection.create"], function (e) {
      const context = e.context;
      const hints = context.hints || {};

      if (hints.createElementsBehavior === false) {
        return;
      }

      const element = context.shape || context.connection;
      const businessObject = element.businessObject;

      if (isLabel(element) || !requiresExternalLabel(element)) {
        return;
      }

      if (getLabel(element) && !is(element, `${MODELER_PREFIX}:Association`)) {
        const labelCenter = getExternalLabelMid(element);
        // we don't care about x and y
        const labelDimensions = textRenderer.getExternalLabelBounds(
          DEFAULT_LABEL_SIZE,
          getLabel(element),
        );

        modeling.createLabel(element, labelCenter, {
          id: businessObject.id + "_label",
          businessObject: businessObject,
          width: labelDimensions.width,
          height: labelDimensions.height,
        });
      }

      if (is(element, `${MODELER_PREFIX}:Association`)) {
        let labelCenter;
        let labelDimensions;
        // Generalization associations cannot have multiplicity labels
        const labelsToCreate =
          businessObject.associationType === ASSOCIATION_TYPES.GENERALIZATION
            ? ["name"]
            : ["sourceMultiplicity", "targetMultiplicity", "name"];
        for (let labelAttribute of labelsToCreate) {
          if (labelAttribute === "sourceMultiplicity") {
            labelCenter = getSourceLabelPosition(element);
            labelDimensions = textRenderer.getExternalLabelBounds(
              DEFAULT_LABEL_SIZE,
              businessObject.sourceMultiplicity || "*",
            );
          } else if (labelAttribute === "targetMultiplicity") {
            labelCenter = getTargetLabelPosition(element);
            labelDimensions = textRenderer.getExternalLabelBounds(
              DEFAULT_LABEL_SIZE,
              businessObject.targetMultiplicity || "*",
            );
          } else if (labelAttribute === "name") {
            if (!businessObject.name) {
              continue;
            }
            labelCenter = getExternalLabelMid(element);
            labelDimensions = textRenderer.getExternalLabelBounds(
              DEFAULT_LABEL_SIZE,
              businessObject.name,
            );
          }
          businessObject.labelAttribute = labelAttribute;
          modeling.createLabel(element, labelCenter, {
            id: buildAssociationLabelId(businessObject.id, labelAttribute),
            labelAttribute,
            businessObject,
            width: labelDimensions.width,
            height: labelDimensions.height,
          });
        }
      }
    });

    // update label after label shape was deleted
    this.postExecute("shape.delete", function (event) {
      const context = event.context;
      const labelTarget = context.labelTarget;
      const hints = context.hints || {};

      // check if label
      if (labelTarget && hints.unsetLabel !== false) {
        if (is(labelTarget, `${MODELER_PREFIX}:Association`)) {
          // Pass the changed attribute to the update call
          const editedAttribute = getLabelAttribute(context.shape);
          labelTarget.businessObject.labelAttribute = editedAttribute;
          modeling.updateLabel(labelTarget, null, null, {
            removeShape: false,
            editedAttribute,
          });
        }
        modeling.updateLabel(labelTarget, null, null, { removeShape: false });
      }
    });

    // update di information on label creation
    this.postExecute(["label.create"], function (event) {
      const context = event.context;
      const element = context.shape;
      let businessObject, di;

      // we want to trigger on real labels only
      if (!element.labelTarget) {
        return;
      }

      // we want to trigger on board elements only
      if (
        !is(element.labelTarget || element, `${MODELER_PREFIX}:ModelElement`)
      ) {
        return;
      }

      ((businessObject = element.businessObject), (di = businessObject.di));

      if (!di.label) {
        di.label = customElementFactory.createDiLabel(element);
      }

      assign(di.label.bounds, {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      });
    });

    this.postExecute(
      ["connection.layout", "connection.updateWaypoints"],
      function (event) {
        const context = event.context;
        const hints = context.hints || {};

        if (hints.labelBehavior === false) {
          return;
        }

        const connection = context.connection;

        for (let label of connection.labels) {
          // handle missing label as well as the case
          // that the label parent does not exist (yet),
          // because it is being pasted / created via multi element create
          //
          // Cf. https://github.com/bpmn-io/bpmn-js/pull/1227
          if (!label || !label.parent) {
            return;
          }
          const labelAdjustment = self.getVisibleLabelAdjustment(event, label);

          modeling.moveShape(label, labelAdjustment);
        }
      },
    );

    // keep label position on shape replace
    this.postExecute(["shape.replace"], function (event) {
      const context = event.context;
      const newShape = context.newShape;
      const oldShape = context.oldShape;

      const businessObject = getBusinessObject(newShape);

      if (
        businessObject &&
        requiresExternalLabel(businessObject) &&
        oldShape.label &&
        newShape.label
      ) {
        newShape.label.x = oldShape.label.x;
        newShape.label.y = oldShape.label.y;
      }
    });

    // move external label after resizing
    this.postExecute("shape.resize", function (event) {
      const context = event.context;
      const shape = context.shape;
      const newBounds = context.newBounds;
      const oldBounds = context.oldBounds;

      if (existsExternalLabel(shape)) {
        const label = shape.label;
        const labelMid = getMid(label);
        const edges = asEdges(oldBounds);

        // get nearest border point to label as reference point
        const referencePoint = getReferencePoint(labelMid, edges);

        const delta = getReferencePointDelta(
          referencePoint,
          oldBounds,
          newBounds,
        );

        modeling.moveShape(label, delta);
      }
    });
  }

  getVisibleLabelAdjustment(event, label) {
    const context = event.context;
    const connection = context.connection;
    const hints = assign({}, context.hints);
    const newWaypoints = context.newWaypoints || connection.waypoints;
    const oldWaypoints = context.oldWaypoints;

    if (typeof hints.startChanged === "undefined") {
      hints.startChanged = !!hints.connectionStart;
    }

    if (typeof hints.endChanged === "undefined") {
      hints.endChanged = !!hints.connectionEnd;
    }

    return getLabelAdjustment(label, newWaypoints, oldWaypoints, hints);
  }
}

LabelBehavior.$inject = [
  "eventBus",
  "modeling",
  "customElementFactory",
  "textRenderer",
];

// helpers //////////////////////

/**
 * Calculates a reference point delta relative to a new position
 * of a certain element's bounds
 */
export function getReferencePointDelta(referencePoint, oldBounds, newBounds) {
  const newReferencePoint = getNewAttachPoint(
    referencePoint,
    oldBounds,
    newBounds,
  );
  return roundPoint(delta(newReferencePoint, referencePoint));
}

/**
 * Generates the nearest point (reference point) for a given point
 * onto given set of lines
 */
export function getReferencePoint(point, lines) {
  if (!lines.length) {
    return;
  }

  const nearestLine = getNearestLine(point, lines);
  return perpendicularFoot(point, nearestLine);
}

/**
 * Convert the given bounds to a lines array containing all edges
 */
export function asEdges(bounds) {
  return [
    [
      // top
      {
        x: bounds.x,
        y: bounds.y,
      },
      {
        x: bounds.x + (bounds.width || 0),
        y: bounds.y,
      },
    ],
    [
      // right
      {
        x: bounds.x + (bounds.width || 0),
        y: bounds.y,
      },
      {
        x: bounds.x + (bounds.width || 0),
        y: bounds.y + (bounds.height || 0),
      },
    ],
    [
      // bottom
      {
        x: bounds.x,
        y: bounds.y + (bounds.height || 0),
      },
      {
        x: bounds.x + (bounds.width || 0),
        y: bounds.y + (bounds.height || 0),
      },
    ],
    [
      // left
      {
        x: bounds.x,
        y: bounds.y,
      },
      {
        x: bounds.x,
        y: bounds.y + (bounds.height || 0),
      },
    ],
  ];
}

/**
 * Returns the nearest line for a given point by distance
 */
function getNearestLine(point, lines) {
  const distances = lines.map(function (l) {
    return {
      line: l,
      distance: getDistancePointLine(point, l),
    };
  });

  const sorted = sortBy(distances, "distance");
  return sorted[0].line;
}
