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
