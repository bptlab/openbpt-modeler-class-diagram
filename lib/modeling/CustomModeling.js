import BaseModeling from "diagram-js/lib/features/modeling/Modeling";
import UpdateLabelHandler from "./UpdateLabelHandler";
import UpdatePropertiesHandler from "./UpdatePropertiesHandler";

export default class CustomModeling extends BaseModeling {
  constructor(eventBus, elementFactory, commandStack) {
    super(eventBus, elementFactory, commandStack);
  }

  updateLabel(element, newLabel, newBounds, hints) {
    this._commandStack.execute("element.updateLabel", {
      element: element,
      newLabel: newLabel,
      newBounds: newBounds,
      hints: hints || {},
    });
  }

  updateProperties(element, properties, hints) {
    this._commandStack.execute("element.updateProperties", {
      element: element,
      properties: properties,
      hints: hints || {},
    });
  }

  getHandlers() {
    const handlers = super.getHandlers.call(this);
    handlers["element.updateLabel"] = UpdateLabelHandler;
    handlers["element.updateProperties"] = UpdatePropertiesHandler;
    return handlers;
  }
}

CustomModeling.$inject = ["eventBus", "elementFactory", "commandStack"];
