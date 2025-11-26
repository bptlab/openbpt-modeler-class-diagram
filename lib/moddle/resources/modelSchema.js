import {
  MODELER_PREFIX,
  MODELER_DI_PREFIX,
  MODELER_NAMESPACE,
} from "../../util/constants";

const modelSchema = {
  name: "Class Diagram",
  uri: MODELER_NAMESPACE,
  prefix: MODELER_PREFIX,
  xml: {
    tagAlias: "lowerCase",
  },
  types: [
    {
      name: "Schema",
      isAbstract: true,
      properties: [
        {
          name: "id",
          isAttr: true,
          type: "String",
          isId: true,
        },
        {
          name: "name",
          isAttr: true,
          type: "String",
        },
      ],
    },
    {
      name: "ModelElement",
      isAbstract: true,
      superClass: ["Schema"],
    },
    {
      name: "Node",
      isAbstract: true,
      superClass: ["ModelElement"],
    },
    {
      name: "Class",
      superClass: ["Node"],
      properties: [
        {
          name: "attributes",
          isAttr: true,
          type: "String",
        },
      ],
    },
    {
      name: "Connection",
      isAbstract: true,
      superClass: ["ModelElement"],
    },
    {
      name: "BinaryConnection",
      isAbstract: true,
      superClass: ["Connection"],
      properties: [
        {
          name: "source",
          isAttr: true,
          type: "Node",
          isReference: true,
        },
        {
          name: "target",
          isAttr: true,
          type: "Node",
          isReference: true,
        },
      ],
    },
    {
      name: "Association",
      superClass: ["BinaryConnection"],
      properties: [
        {
          name: "associationType",
          isAttr: true,
          type: "String",
          default: "standard",
        },
        {
          name: "sourceMultiplicity",
          isAttr: true,
          type: "String",
          default: "*",
        },
        {
          name: "targetMultiplicity",
          isAttr: true,
          type: "String",
          default: "*",
        },
      ],
    },
    {
      name: "Model",
      superClass: ["Schema"],
      properties: [
        {
          name: "modelElements",
          type: "ModelElement",
          isMany: true,
        },
      ],
    },
    {
      name: "Definitions",
      superClass: ["Schema"],
      properties: [
        {
          name: "targetNamespace",
          isAttr: true,
          type: "String",
        },
        {
          name: "expressionLanguage",
          default: "http://www.w3.org/1999/XPath",
          isAttr: true,
          type: "String",
        },
        {
          name: "typeLanguage",
          default: "http://www.w3.org/2001/XMLSchema",
          isAttr: true,
          type: "String",
        },
        {
          name: "model",
          type: "Model",
        },
        {
          name: "diagram",
          type: `${MODELER_DI_PREFIX}:Diagram`,
        },
        {
          name: "exporter",
          isAttr: true,
          type: "String",
        },
        {
          name: "exporterVersion",
          isAttr: true,
          type: "String",
        },
      ],
    },
  ],
};

export default modelSchema;
