import { getBusinessObject } from "../util/Util";

function getColor(element) {
  const bo = getBusinessObject(element);

  return bo.color || element.color;
}

function getDi(element) {
  return getBusinessObject(element).di;
}

export function getFillColor(element, defaultColor) {
  return (
    getColor(element) ||
    getDi(element).get("bioc:fill") ||
    defaultColor ||
    "white"
  );
}

export function getStrokeColor(element, defaultColor) {
  return (
    getColor(element) ||
    getDi(element).get("bioc:stroke") ||
    defaultColor ||
    "black"
  );
}

export function getTitleLabelOptions(element, padding) {
  return {
    box: {
      width: element.width,
    },
    padding,
    align: "center-top",
    style: {
      fill: element.color === "black" ? "white" : "black",
    },
  };
}

export function getAttributeLabelOptions(element, padding) {
  return {
    box: {
      width: element.width,
    },
    padding,
    align: "left-top",
    style: {
      fill: element.color === "black" ? "white" : "black",
    },
  };
}

const visibilityToStringMap = {
  public: "+",
  private: "-",
  protected: "#",
  package: "~",
  none: "",
};

export function getAttributesLabelString(attributes) {
  const attributeStrings = attributes.map((attr) => {
    return `${visibilityToStringMap[attr.visibility] || ""} ${attr.name}: ${attr.type}`.trim();
  });
  return attributeStrings.join("\n");
}
