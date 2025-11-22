import { getMid, asTRBL } from "diagram-js/lib/layout/LayoutUtil";
import {
  findFreePosition,
  generateGetNextPosition,
  getConnectedDistance,
} from "diagram-js/lib/features/auto-place/AutoPlaceUtil";
import { MODELER_PREFIX } from "../util/constants";

export function getNewShapePosition(source, element) {
  if (element.type === `${MODELER_PREFIX}:Class`) {
    return getFlowNodePosition(source, element);
  }
}

/**
 * Always try to place element right of source;
 * compute actual distance from previous nodes in flow.
 */
export function getFlowNodePosition(source, element) {
  const sourceTrbl = asTRBL(source);
  const sourceMid = getMid(source);
  const defaultHorizontalDistance = 100;

  const horizontalDistance = getConnectedDistance(source, {
    filter: function filter(connection) {
      return connection.type === `${MODELER_PREFIX}:Association`;
    },
    defaultDistance: defaultHorizontalDistance,
  });

  // CustomModelerTodo: Define the margin and minimum distance between elements.
  const margin = 30;
  const minDistance = 80;
  const orientation = "left";
  const position = {
    x: sourceTrbl.right + horizontalDistance + element.width / 2,
    y: sourceMid.y + getVerticalDistance(orientation, minDistance),
  };
  const nextPositionDirection = {
    y: {
      margin: margin,
      minDistance: minDistance,
    },
  };
  return findFreePosition(
    source,
    element,
    position,
    generateGetNextPosition(nextPositionDirection),
  );
}

function getVerticalDistance(orientation, minDistance) {
  if (orientation.indexOf("top") !== -1) {
    return -1 * minDistance;
  } else if (orientation.indexOf("bottom") !== -1) {
    return minDistance;
  } else {
    return 0;
  }
}
