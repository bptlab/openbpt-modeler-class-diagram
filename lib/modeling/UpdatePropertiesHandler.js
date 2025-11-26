import { reduce, keys, forEach, assign } from "min-dash";
import { getBusinessObject, getDi } from "../util/Util";

var NULL_DIMENSIONS = {
  width: 0,
  height: 0,
};

export default class UpdatePropertiesHandler {
  constructor(elementRegistry, moddle, modeling, textRenderer) {
    this._elementRegistry = elementRegistry;
    this._moddle = moddle;
    this._modeling = modeling;
    this._textRenderer = textRenderer;
  }

  execute(context) {
    const element = context.element;
    const changed = [element];

    if (!element) {
      throw new Error("element required");
    }

    const elementRegistry = this._elementRegistry;
    const ids = this._moddle.ids;
    const businessObject = element.businessObject;
    const properties = unwrapBusinessObjects(context.properties);
    const oldProperties =
      context.oldProperties || getProperties(element, properties);

    if (isIdChange(properties, businessObject)) {
      ids.unclaim(businessObject["id"]);

      elementRegistry.updateId(element, properties["id"]);

      ids.claim(properties["id"], businessObject);
    }

    // update properties
    setProperties(element, properties);

    // store old values
    context.oldProperties = oldProperties;
    context.changed = changed;

    // indicate changed on objects affected by the update
    return changed;
  }

  postExecute(context) {
    const element = context.element;
    const label = element.label;
    const text = label && getBusinessObject(label).name;

    if (!text) {
      return;
    }

    // get layouted text bounds and resize external label accordingly
    const newLabelBounds = this._textRenderer.getExternalLabelBounds(
      label,
      text,
    );
    this._modeling.resizeShape(label, newLabelBounds, NULL_DIMENSIONS);
  }

  revert(context) {
    const element = context.element;
    const properties = context.properties;
    const oldProperties = context.oldProperties;
    const businessObject = element.businessObject;
    const elementRegistry = this._elementRegistry;
    const ids = this._moddle.ids;

    // update properties
    setProperties(element, oldProperties);

    if (isIdChange(properties, businessObject)) {
      ids.unclaim(properties["id"]);

      elementRegistry.updateId(element, oldProperties["id"]);

      ids.claim(oldProperties["id"], businessObject);
    }

    return context.changed;
  }
}

UpdatePropertiesHandler.$inject = [
  "elementRegistry",
  "moddle",
  "modeling",
  "textRenderer",
];

function isIdChange(properties, businessObject) {
  return "id" in properties && properties["id"] !== businessObject["id"];
}

function getProperties(element, properties) {
  const propertyNames = keys(properties);
  const businessObject = element.businessObject;
  const di = getDi(element);

  return reduce(
    propertyNames,
    function (result, key) {
      // handle DI separately
      if (key !== "di") {
        result[key] = businessObject.get(key);
      } else {
        result[key] = getDiProperties(di, keys(properties.di));
      }

      return result;
    },
    {},
  );
}

function getDiProperties(di, propertyNames) {
  return reduce(
    propertyNames,
    function (result, key) {
      result[key] = di && di.get(key);

      return result;
    },
    {},
  );
}

function setProperties(element, properties) {
  const businessObject = element.businessObject;
  const di = getDi(element);

  forEach(properties, function (value, key) {
    if (key !== "di") {
      businessObject.set(key, value);
    } else {
      // only update if di exists
      if (di) {
        setDiProperties(di, value);
      }
    }
  });
}

function setDiProperties(di, properties) {
  forEach(properties, function (value, key) {
    di.set(key, value);
  });
}

const referencePropertyNames = ["default"];

// Make sure we unwrap the actual business object behind diagram element that
// may have been passed as arguments.
function unwrapBusinessObjects(properties) {
  const unwrappedProps = assign({}, properties);

  referencePropertyNames.forEach(function (name) {
    if (name in properties) {
      unwrappedProps[name] = getBusinessObject(unwrappedProps[name]);
    }
  });

  return unwrappedProps;
}
