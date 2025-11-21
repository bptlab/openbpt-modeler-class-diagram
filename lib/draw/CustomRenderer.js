import { query as domQuery } from "min-dom";
import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses,
} from "tiny-svg";
import { assign, isObject } from "min-dash";
import { componentsToPath, createLine } from "diagram-js/lib/util/RenderUtil";
import Ids from "ids";

import { DEFAULT_TEXT_SIZE } from "./TextRenderer";
import { getLabel } from "../modeling/LabelUtil";
import { getFillColor, getStrokeColor } from "./RendererUtil";
import { MODELER_PREFIX } from "../util/constants";

const RENDERER_IDS = new Ids();

export default class CustomRenderer extends BaseRenderer {
  constructor(eventBus, styles, canvas, textRenderer) {
    super(eventBus, 2000);

    this._styles = styles;
    this._canvas = canvas;
    this._textRenderer = textRenderer;
    this._markers = {};
    this._rendererId = RENDERER_IDS.next();
    this._defaultLineStyle = {
      strokeLinejoin: "round",
      strokeWidth: 2,
      stroke: "black",
    };
  }

  canRender(element) {
    return true;
  }

  // CustomModelerTodo: Implement the rendering of the different shapes.
  drawShape(parentGfx, element, attrs = {}) {
    if (element.type === `${MODELER_PREFIX}:Class`) {
      return this.drawClass(parentGfx, element, attrs);
    } else if (element.type === `${MODELER_PREFIX}:Association`) {
      return this.drawAssociation(parentGfx, element);
    } else if (element.type === "label") {
      return this.renderExternalLabel(parentGfx, element);
    }
  }

  drawConnection(parentGfx, element) {
    return this.drawShape(parentGfx, element);
  }

  // TODO: Rework
  drawClass = function (parentGfx, element, attrs) {
    const defaultFillColor = "white";
    const defaultStrokeColor = "black";
    const HIGH_FILL_OPACITY = 0.35;

    // Probably have to compute element height before this somehow?
    const shape = this.drawRect(
      parentGfx,
      element.width,
      element.height,
      0,
      assign(
        {
          fill: getFillColor(element, defaultFillColor),
          fillOpacity: HIGH_FILL_OPACITY,
          stroke: getStrokeColor(element, defaultStrokeColor),
        },
        attrs,
      ),
    );

    this.renderTitleSection(parentGfx, element);

    this.renderAttributeSection(parentGfx, element);

    return shape;
  };

  drawRect = function (parentGfx, width, height, r, offset, attrs) {
    if (isObject(offset)) {
      attrs = offset;
      offset = 0;
    }
    offset = offset || 0;

    const defaultRectStyle = {
      stroke: "black",
      strokeWidth: 2,
      fill: "white",
    };
    // Compute final style; default style only used if respective attribute not set in attrs
    const rectStyle = this._styles.computeStyle(attrs, defaultRectStyle);

    const rect = svgCreate("rect");
    svgAttr(rect, {
      x: offset,
      y: offset,
      width: width - offset * 2,
      height: height - offset * 2,
      rx: r,
      ry: r,
    });
    svgAttr(rect, rectStyle);

    svgAppend(parentGfx, rect);

    return rect;
  };

  renderTitleSection = function (parentGfx, element) {
    // TODO: adapt titleHeight based on text size & number of lines in title
    // probably requires to switch order of divider and text box - maybe just specifying the width of the text box and letting it adapt height automatically
    const titleHeight = 30;
    this.addDivider(parentGfx, element, titleHeight);

    const text = getLabel(element);
    this.renderLabel(parentGfx, text || "", {
      box: {
        width: element.width,
        height: titleHeight,
      },
      padding: 5,
      align: "center-middle",
      style: {
        fill: element.color === "black" ? "white" : "black",
        fontSize: element.textSize || DEFAULT_TEXT_SIZE,
      },
    });
  };

  addDivider = function (parentGfx, element, y) {
    const waypoints = [
      { x: 0, y },
      { x: element.width, y },
    ];

    this.drawLine(parentGfx, waypoints, {
      stroke: getStrokeColor(element, this._defaultLineStyle.stroke),
    });
  };

  drawLine = function (parentGfx, waypoints, attrs) {
    const lineStyle = this._styles.computeStyle(attrs, this._defaultLineStyle);
    const line = createLine(waypoints, lineStyle);

    svgAppend(parentGfx, line);

    return line;
  };

  renderAttributeSection = function (parentGfx, element) {
    const businessObject = element.businessObject;
    if (businessObject.attributes && businessObject.attributes.length > 0) {
      // TODO: adapt attributeSectionOffsetY based on title height
      const attributeSectionOffsetY = 30;
      const text = businessObject.attributes;
      // TODO: somehow I can't set the coordinates of the text box
      this.renderLabel(parentGfx, text, {
        box: {
          width: element.width,
          height: element.height + attributeSectionOffsetY,
          // x: 0,
          // y: element.y + attributeSectionOffsetY,
        },
        padding: 5,
        align: "left-middle",
        style: {
          fill: element.color === "black" ? "white" : "black",
          fontSize: element.textSize || DEFAULT_TEXT_SIZE,
        },
      });
    }
  };

  drawAssociation = function (parentGfx, element) {
    const pathData = this.getPathDataFromConnection(element);
    const color = "black";

    const attrs = this._styles.computeStyle(
      {},
      ["no-fill"],
      this._defaultLineStyle,
    );

    const association = svgCreate("path");
    svgAttr(association, { d: pathData });
    svgAttr(association, attrs);

    svgAppend(parentGfx, association);

    return association;
  };

  getPathDataFromConnection(connection) {
    const waypoints = connection.waypoints;
    let pathData = "m  " + waypoints[0].x + "," + waypoints[0].y;

    for (let i = 1; i < waypoints.length; i++) {
      pathData += "L" + waypoints[i].x + "," + waypoints[i].y + " ";
    }
    return pathData;
  }

  marker(type, fill, stroke) {
    const id =
      type +
      "-" +
      colorEscape(fill) +
      "-" +
      colorEscape(stroke) +
      "-" +
      this._rendererId;

    if (!this._markers[id]) {
      this.createMarker(id, type, fill, stroke);
    }

    return "url(#" + id + ")";
  }

  createMarker(id, type, fill, stroke) {
    if (type === "defaultarc-end") {
      const defaultarcEnd = svgCreate("path", {
        d: "M 1 5 L 11 10 L 1 15 Z",
        fill,
        stroke,
        strokeLinecap: "round",
      });

      this.addMarker(id, {
        element: defaultarcEnd,
        ref: { x: 11, y: 10 },
        scale: 0.5,
      });
    }
  }

  addMarker(id, options) {
    const { ref = { x: 0, y: 0 }, scale = 1, element } = options;

    const marker = svgCreate("marker", {
      id,
      viewBox: "0 0 20 20",
      refX: ref.x,
      refY: ref.y,
      markerWidth: 20 * scale,
      markerHeight: 20 * scale,
      orient: "auto",
    });
    svgAppend(marker, element);

    let defs = domQuery("defs", this._canvas._svg);

    if (!defs) {
      defs = svgCreate("defs");
      svgAppend(this._canvas._svg, defs);
    }

    svgAppend(defs, marker);

    this._markers[id] = marker;
  }

  renderLabel(parentGfx, label, attrs = {}) {
    // Why?
    attrs = assign(
      {
        size: {
          width: 100,
        },
      },
      attrs,
    );

    const text = this._textRenderer.createText(label, attrs);

    svgClasses(text).add("djs-label");

    svgAppend(parentGfx, text);

    return text;
  }

  renderExternalLabel = function (parentGfx, element, attrs = {}) {
    const box = {
      width: 90,
      height: 30,
      x: element.width / 2 + element.x,
      y: element.height / 2 + element.y,
    };

    return this.renderLabel(parentGfx, getLabel(element), {
      box: box,
      fitBox: true,
      style: assign({}, this._textRenderer.getExternalStyle(), {
        fill: "black",
      }),
    });
  };

  // ToDo: What to do with this?
  getShapePath(element) {
    if (element.type === `${MODELER_PREFIX}:Place`) {
      return getPlacePath(element.x, element.y, element.width, element.height);
    } else if (element.type === `${MODELER_PREFIX}:Transition`) {
      return getTransitionPath(
        element.x,
        element.y,
        element.width,
        element.height,
      );
    }
  }
}

CustomRenderer.$inject = ["eventBus", "styles", "canvas", "textRenderer"];

// helpers
function colorEscape(colorString) {
  // only allow characters and numbers
  return colorString.replace(/[^0-9a-zA-z]+/g, "_");
}

// The following functions return the svg path for the respective shapes.
// For further details, see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
function getTransitionPath(x, y, width, height) {
  return componentsToPath([
    ["M", x, y],
    ["h", width],
    ["v", height],
    ["h", -width],
    ["z"],
  ]);
}

function getPlacePath(x, y, width, height) {
  const radius = width / 2;

  // Get center coordinates of the circle
  const cx = x + radius;
  const cy = y + radius;

  return componentsToPath([
    ["M", cx, cy],
    ["m", 0, -radius],
    ["a", radius, radius, 0, 1, 1, 0, 2 * radius],
    ["a", radius, radius, 0, 1, 1, 0, -2 * radius],
  ]);
}
