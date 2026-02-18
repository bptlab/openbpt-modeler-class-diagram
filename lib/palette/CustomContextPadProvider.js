import { assign } from "min-dash";
import { is } from "../util/Util";
import { MODELER_PREFIX, ASSOCIATION_TYPES } from "../util/constants";
import { isLabel } from "../modeling/LabelUtil";
import generatedIcons from "../util/generated-icons";

// In the context pad provider, the actions available in the context menu when selecting an element are defined.
export default class CustomContextPadProvider {
  constructor(
    connect,
    contextPad,
    modeling,
    elementFactory,
    create,
    autoPlace,
  ) {
    this._connect = connect;
    this._modeling = modeling;
    this._elementFactory = elementFactory;
    this._create = create;
    this._autoPlace = autoPlace;

    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    const connect = this._connect;
    const modeling = this._modeling;
    const elementFactory = this._elementFactory;
    const create = this._create;
    const autoPlace = this._autoPlace;

    function removeElement() {
      modeling.removeElements([element]);
    }

    // CustomModelerTodo: Define functions for all entries in the context pad of an element.
    // For example, creating and appending new model elements.
    function startConnect(event, element, autoActivate) {
      connect.start(event, element, autoActivate);
    }

    function appendClass(event, element, options = {}) {
      const shape = elementFactory.createShape(
        assign({ type: `${MODELER_PREFIX}:Class` }, options),
      );

      autoPlace.append(element, shape, {
        connection: { type: `${MODELER_PREFIX}:Association` },
      });
    }

    function appendClassWithAttributes(event, element) {
      appendClass(event, element);
    }

    function appendCollapsedClass(event, element) {
      appendClass(event, element, { expanded: false });
    }

    function appendClassStart(event, options = {}) {
      const shape = elementFactory.createShape(
        assign({ type: `${MODELER_PREFIX}:Class` }, options),
      );

      create.start(event, shape, { source: element });
    }

    function appendClassWithAttributesStart(event) {
      appendClassStart(event);
    }

    function appendCollapsedClassStart(event) {
      appendClassStart(event, { expanded: false });
    }

    function changeAssociationType(event, element, newType) {
      modeling.updateProperties(element, { associationType: newType });
    }

    const actions = {};

    // CustomModelerTodo: Define the context menu entries for each element type.
    // "group" is the row in which the action will be displayed. Within a row, elements are in the same order as they are assigned to the actions object.
    // "className" is the icon to be displayed.
    // "title" is the tooltip to be displayed.

    // Class actions
    if (is(element, `${MODELER_PREFIX}:Class`)) {
      assign(actions, {
        "append-class-collapsed": {
          group: "row_1",
          imageUrl: generatedIcons["cd-class-simple"],
          title: "Append collapsed class",
          action: {
            click: appendCollapsedClass,
            dragstart: appendCollapsedClassStart,
          },
        },
      });
      assign(actions, {
        "append-class-attributes-only": {
          group: "row_1",
          imageUrl: generatedIcons["cd-class-attributes-only"],
          title: "Append class with attributes only",
          action: {
            click: appendClassWithAttributes,
            dragstart: appendClassWithAttributesStart,
          },
        },
      });
      assign(actions, {
        connect: {
          group: "row_2",
          imageUrl: generatedIcons["cd-association-standard"],
          title: "Connect",
          action: {
            click: startConnect,
            dragstart: startConnect,
          },
        },
      });
    }

    if (is(element, `${MODELER_PREFIX}:Association`) && !isLabel(element)) {
      let rowNumber = 0;
      for (let type in ASSOCIATION_TYPES) {
        if (
          !(element.businessObject.associationType === ASSOCIATION_TYPES[type])
        ) {
          assign(actions, {
            [`change-association-to-${ASSOCIATION_TYPES[type]}`]: {
              group: `row_${rowNumber}`,
              imageUrl:
                generatedIcons[`cd-association-${ASSOCIATION_TYPES[type]}`],
              title: `Change association type to ${ASSOCIATION_TYPES[type]}`,
              action: {
                click: (event, element) =>
                  changeAssociationType(
                    event,
                    element,
                    ASSOCIATION_TYPES[type],
                  ),
              },
            },
          });
          rowNumber++;
        }
      }
    }

    // Common actions
    assign(actions, {
      delete: {
        group: "row_3",
        className: "bpmn-icon-trash",
        title: "Remove",
        action: {
          click: removeElement,
          dragstart: removeElement,
        },
      },
    });
    return actions;
  }
}

CustomContextPadProvider.$inject = [
  "connect",
  "contextPad",
  "modeling",
  "elementFactory",
  "create",
  "autoPlace",
];
