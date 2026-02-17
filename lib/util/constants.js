export const MODELER_PREFIX = "cd";
export const MODELER_DI_PREFIX = `${MODELER_PREFIX}Di`;
export const MODELER_NAMESPACE = `http://bpt-lab.org/schemas/${MODELER_PREFIX}`;
export const MODELER_DI_NAMESPACE = `http://bpt-lab.org/schemas/${MODELER_DI_PREFIX}`;
export const ASSOCIATION_TYPES = Object.freeze({
  STANDARD: "standard",
  GENERALIZATION: "generalization",
  AGGREGATION: "aggregation",
  COMPOSITION: "composition",
});
