import { assign } from "min-dash";
import { is } from "../util/Util";
import { MODELER_PREFIX, ASSOCIATION_TYPES } from "../util/constants";
import { isLabel } from "../modeling/LabelUtil";

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

    function appendClass(event, element) {
      const shape = elementFactory.createShape({
        type: `${MODELER_PREFIX}:Class`,
      });

      autoPlace.append(element, shape, {
        connection: { type: `${MODELER_PREFIX}:Association` },
      });
    }

    function appendClassStart(event) {
      const shape = elementFactory.createShape({
        type: `${MODELER_PREFIX}:Class`,
      });

      create.start(event, shape, { source: element });
    }

    function changeAssociationType(event, element, newType) {
      modeling.updateProperties(element, { associationType: newType });
    }

    const actions = {};

    // CustomModelerTodo: Define the context menu entries for each element type.
    // "group" is the row in which the action will be displayed. Within a row, elements are in the same order as they are assigned to the actions object.
    // "className" is the icon to be displayed.
    // "title" is the tooltip to be displayed.

    console.log(element);
    // Class actions
    if (is(element, `${MODELER_PREFIX}:Class`)) {
      assign(actions, {
        "append-class": {
          group: "row_1",
          className: "pn-icon-transition",
          title: "Append class",
          action: {
            click: appendClass,
            dragstart: appendClassStart,
          },
        },
      });
      assign(actions, {
        connect: {
          group: "row_2",
          className: "bpmn-icon-connection",
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
              className: "bpmn-icon-connection",
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
