import { is } from "../util/Util";
import {
  getLabelAttribute,
  existsExternalLabel,
  setLabel,
  requiresExternalLabel,
  getExternalLabelMid,
  getLabel,
  isLabel,
  DEFAULT_LABEL_SIZE,
} from "./LabelUtil";
import { MODELER_PREFIX } from "../util/constants";

export default class UpdateLabelHandler {
  constructor(modeling, textRenderer) {
    this._modeling = modeling;
    this._textRenderer = textRenderer;
  }
  setText(element, text, oldText = "", editedAttribute = null) {
    editedAttribute = editedAttribute || getLabelAttribute(element);
    // Restrict association multiplicity format
    if (
      text !== null &&
      is(element, `${MODELER_PREFIX}:Association`) &&
      ["sourceMultiplicity", "targetMultiplicity"].includes(editedAttribute)
    ) {
      if (!/^(\*|(\d+(\.\.(\*|\d+))?))$/.test(text)) {
        text = oldText;
      }
    }

    if (is(element, `${MODELER_PREFIX}:Association`) && text === null) {
      setLabel(element, text, editedAttribute);
      return [element, element];
    }

    const label =
      element.labels.filter(
        (label) => label.labelAttribute === editedAttribute,
      )[0] ||
      element.label ||
      element;
    const labelTarget = element.labelTarget || element;

    setLabel(label, text, editedAttribute);

    return [label, labelTarget];
  }

  preExecute(context) {
    const { element, newLabel } = context;
    const businessObject = element.businessObject;
    const labelAttribute = getLabelAttribute(element);

    // Create external label if necessary
    if (
      !isLabel(element) &&
      !isEmptyText(newLabel) &&
      requiresExternalLabel(element) &&
      (!existsExternalLabel(element) ||
        element.labels.filter(
          (label) => label.labelAttribute === labelAttribute,
        ).length === 0)
    ) {
      const paddingTop = 7;
      let labelCenter = getExternalLabelMid(element);
      labelCenter = {
        x: labelCenter.x,
        y: labelCenter.y + paddingTop,
      };
      let labelId = businessObject.id + "_label";
      if (is(element, `${MODELER_PREFIX}:Association`)) {
        labelId += "_" + labelAttribute;
      }
      const labelDimensions = this._textRenderer.getExternalLabelBounds(
        DEFAULT_LABEL_SIZE,
        newLabel,
      );
      this._modeling.createLabel(element, labelCenter, {
        id: labelId,
        labelAttribute: labelAttribute,
        businessObject: businessObject,
        width: labelDimensions.width,
        height: labelDimensions.height,
      });
    }
  }

  execute(context) {
    const { element, newLabel } = context;
    const oldLabel = getLabel(element);
    context.oldLabel = oldLabel;
    const editedAttribute = context.hints?.editedAttribute || null;
    return this.setText(element, newLabel, oldLabel, editedAttribute);
  }

  postExecute(context) {
    let { element, newLabel, newBounds } = context;
    const hints = context.hints || {};
    const label = element.label || element;

    // Ignore internal labels
    if (!isLabel(label)) {
      return;
    }

    // Remove now empty labels
    if (isLabel(label) && isEmptyText(newLabel)) {
      if (hints.removeShape !== false) {
        this._modeling.removeShape(label, { unsetLabel: false });
      }
      return;
    }

    const text = getLabel(label);

    // resize element based on label _or_ pre-defined bounds
    if (typeof newBounds === "undefined") {
      newBounds = this._textRenderer.getExternalLabelBounds(label, text);
    }

    // setting newBounds to false or _null_ will
    // disable the postExecute resize operation
    if (newBounds) {
      this._modeling.resizeShape(label, newBounds, { width: 0, height: 0 });
    }
  }

  revert(context) {
    const { element, oldLabel, newLabel } = context;
    const editedAttribute = context.hints?.editedAttribute || null;
    // For some reason, revert is sometimes called twice with the first call not containing and parameters
    if (!oldLabel && !newLabel) {
      return;
    }
    return this.setText(element, oldLabel, "", editedAttribute);
  }
}

UpdateLabelHandler.$inject = ["modeling", "textRenderer"];

function isEmptyText(text) {
  return !text || !text.trim();
}
