import { getAngle, getDistancePointPoint, rotateVector } from "./GeometricUtil";
import { getAttachment } from "./LineAttachmentUtil";
import { roundPoint } from "diagram-js/lib/layout/LayoutUtil";

export function findNewLabelLineStartIndex(
  oldWaypoints,
  newWaypoints,
  attachment,
  hints,
) {
  const index = attachment.segmentIndex;
  const offset = newWaypoints.length - oldWaypoints.length;

  // segmentMove happened
  if (hints.segmentMove) {
    const oldSegmentStartIndex = hints.segmentMove.segmentStartIndex;
    const newSegmentStartIndex = hints.segmentMove.newSegmentStartIndex;

    // if label was on moved segment return new segment index
    if (index === oldSegmentStartIndex) {
      return newSegmentStartIndex;
    }

    // label is after new segment index
    if (index >= newSegmentStartIndex) {
      return index + offset < newSegmentStartIndex
        ? newSegmentStartIndex
        : index + offset;
    }

    // if label is before new segment index
    return index;
  }

  // bendpointMove happened
  if (hints.bendpointMove) {
    const insert = hints.bendpointMove.insert;
    const bendpointIndex = hints.bendpointMove.bendpointIndex;
    let newIndex;

    // waypoints length didnt change
    if (offset === 0) {
      return index;
    }

    // label behind new/removed bendpoint
    if (index >= bendpointIndex) {
      newIndex = insert ? index + 1 : index - 1;
    }

    // label before new/removed bendpoint
    if (index < bendpointIndex) {
      newIndex = index;

      // decide label should take right or left segment
      if (
        insert &&
        attachment.type !== "bendpoint" &&
        bendpointIndex - 1 === index
      ) {
        const rel = relativePositionMidWaypoint(newWaypoints, bendpointIndex);

        if (rel < attachment.relativeLocation) {
          newIndex++;
        }
      }
    }

    return newIndex;
  }

  // start/end changed
  if (offset === 0) {
    return index;
  }

  if (hints.connectionStart) {
    return index === 0 ? 0 : null;
  }

  if (hints.connectionEnd) {
    return index === oldWaypoints.length - 2 ? newWaypoints.length - 2 : null;
  }

  // if nothing fits, return null
  return null;
}

// Determine on which side of the connected element the waypoint is docked
function getDockingSide(waypoint, connectedElement) {
  const leftBound = connectedElement.x;
  const rightBound = connectedElement.x + connectedElement.width;
  const topBound = connectedElement.y;
  const bottomBound = connectedElement.y + connectedElement.height;

  if (waypoint.x === leftBound) {
    return "left";
  } else if (waypoint.x === rightBound) {
    return "right";
  } else if (waypoint.y === topBound) {
    return "top";
  } else if (waypoint.y === bottomBound) {
    return "bottom";
  } else {
    return "none";
  }
}

// Position label depending on the side where the association connects.
// isSource is used for alternating the offset direction.
function determineLabelPositionOffset(waypoint, connectedElement, isSource) {
  const dockingSide = getDockingSide(waypoint, connectedElement);
  const defaultOffsetX = 17;
  const defaultOffsetY = 10;
  const largerOffsetY = 15;

  switch (dockingSide) {
    case "left":
      return {
        x: -defaultOffsetX,
        y: isSource ? -defaultOffsetY : largerOffsetY,
      };
    case "right":
      return {
        x: defaultOffsetX,
        y: isSource ? -defaultOffsetY : largerOffsetY,
      };
    case "top":
      return {
        x: isSource ? -defaultOffsetX : defaultOffsetX,
        y: -defaultOffsetY,
      };
    case "bottom":
      return {
        x: isSource ? -defaultOffsetX : defaultOffsetX,
        y: largerOffsetY,
      };
    default:
      return { x: defaultOffsetX, y: -defaultOffsetY };
  }
}

// Default sourceMultiplicity label position
export function getSourceLabelCenterPosition(element) {
  if (element.waypoints) {
    const offset = determineLabelPositionOffset(
      element.waypoints[0],
      element.source,
      true,
    );
    return {
      x: element.waypoints[0].x + offset.x,
      y: element.waypoints[0].y + offset.y,
    };
  } else {
    return {
      x: element.x + element.width / 2,
      y: element.y + element.height + DEFAULT_LABEL_DIMENSIONS.height / 2,
    };
  }
}

// Default targetMultiplicity label position
export function getTargetLabelCenterPosition(element) {
  if (element.waypoints) {
    const offset = determineLabelPositionOffset(
      element.waypoints.at(-1),
      element.target,
      false,
    );
    return {
      x: element.waypoints.at(-1).x + offset.x,
      y: element.waypoints.at(-1).y + offset.y,
    };
  } else {
    return {
      x: element.x + element.width / 2,
      y: element.y + element.height + DEFAULT_LABEL_DIMENSIONS.height / 2,
    };
  }
}

/**
 * Calculate the required adjustment (move delta) for the given label
 * after the connection waypoints got updated.
 *
 * @param {djs.model.Label} label
 * @param {Array<Point>} newWaypoints
 * @param {Array<Point>} oldWaypoints
 * @param {Object} hints
 *
 * @return {Point} delta
 */
export function getLabelAdjustment(label, newWaypoints, oldWaypoints, hints) {
  if (label.labelAttribute == "sourceMultiplicity") {
    const sourceBounds = label.businessObject.source.di.bounds;
    const newPosition = getSourceLabelCenterPosition({
      waypoints: newWaypoints,
      source: sourceBounds,
    });
    newPosition.x -= label.width / 2;
    newPosition.y -= label.height / 2;
    return {
      x: newPosition.x - label.x,
      y: newPosition.y - label.y,
    };
  } else if (label.labelAttribute == "targetMultiplicity") {
    const targetBounds = label.businessObject.target.di.bounds;
    const newPosition = getTargetLabelCenterPosition({
      waypoints: newWaypoints,
      target: targetBounds,
    });
    newPosition.x -= label.width / 2;
    newPosition.y -= label.height / 2;
    return {
      x: newPosition.x - label.x,
      y: newPosition.y - label.y,
    };
  }

  let x = 0;
  let y = 0;
  const labelPosition = getLabelMid(label);

  // get closest attachment
  const attachment = getAttachment(labelPosition, oldWaypoints);
  const oldLabelLineIndex = attachment.segmentIndex;
  const newLabelLineIndex = findNewLabelLineStartIndex(
    oldWaypoints,
    newWaypoints,
    attachment,
    hints,
  );

  if (newLabelLineIndex === null) {
    return { x: x, y: y };
  }

  // should never happen
  // TODO(@janstuemmel): throw an error here when connectionSegmentMove is refactored
  if (newLabelLineIndex < 0 || newLabelLineIndex > newWaypoints.length - 2) {
    return { x: x, y: y };
  }

  const oldLabelLine = getLine(oldWaypoints, oldLabelLineIndex);
  const newLabelLine = getLine(newWaypoints, newLabelLineIndex);
  const oldFoot = attachment.position;

  let relativeFootPosition = getRelativeFootPosition(oldLabelLine, oldFoot);
  const angleDelta = getAngleDelta(oldLabelLine, newLabelLine);

  // special rule if label on bendpoint
  if (attachment.type === "bendpoint") {
    const offset = newWaypoints.length - oldWaypoints.length;
    const oldBendpointIndex = attachment.bendpointIndex;
    const oldBendpoint = oldWaypoints[oldBendpointIndex];

    // bendpoint position hasn't changed, return same position
    if (newWaypoints.indexOf(oldBendpoint) !== -1) {
      return { x: x, y: y };
    }

    // new bendpoint and old bendpoint have same index, then just return the offset
    if (offset === 0) {
      const newBendpoint = newWaypoints[oldBendpointIndex];

      return {
        x: newBendpoint.x - attachment.position.x,
        y: newBendpoint.y - attachment.position.y,
      };
    }

    // if bendpoints get removed
    if (
      offset < 0 &&
      oldBendpointIndex !== 0 &&
      oldBendpointIndex < oldWaypoints.length - 1
    ) {
      relativeFootPosition = relativePositionMidWaypoint(
        oldWaypoints,
        oldBendpointIndex,
      );
    }
  }

  const newFoot = {
    x:
      (newLabelLine[1].x - newLabelLine[0].x) * relativeFootPosition +
      newLabelLine[0].x,
    y:
      (newLabelLine[1].y - newLabelLine[0].y) * relativeFootPosition +
      newLabelLine[0].y,
  };

  // the rotated vector to label
  const newLabelVector = rotateVector(
    {
      x: labelPosition.x - oldFoot.x,
      y: labelPosition.y - oldFoot.y,
    },
    angleDelta,
  );

  // the new relative position
  x = newFoot.x + newLabelVector.x - labelPosition.x;
  y = newFoot.y + newLabelVector.y - labelPosition.y;

  return roundPoint({
    x: x,
    y: y,
  });
}

// HELPERS //////////////////////

function relativePositionMidWaypoint(waypoints, idx) {
  const distanceSegment1 = getDistancePointPoint(
    waypoints[idx - 1],
    waypoints[idx],
  );
  const distanceSegment2 = getDistancePointPoint(
    waypoints[idx],
    waypoints[idx + 1],
  );

  const relativePosition =
    distanceSegment1 / (distanceSegment1 + distanceSegment2);

  return relativePosition;
}

function getLabelMid(label) {
  return {
    x: label.x + label.width / 2,
    y: label.y + label.height / 2,
  };
}

function getAngleDelta(l1, l2) {
  const a1 = getAngle(l1);
  const a2 = getAngle(l2);
  return a2 - a1;
}

function getLine(waypoints, idx) {
  return [waypoints[idx], waypoints[idx + 1]];
}

function getRelativeFootPosition(line, foot) {
  const length = getDistancePointPoint(line[0], line[1]);
  const lengthToFoot = getDistancePointPoint(line[0], foot);

  return length === 0 ? 0 : lengthToFoot / length;
}
