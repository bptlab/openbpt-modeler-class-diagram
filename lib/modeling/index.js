import CroppingConnectionDocking from "diagram-js/lib/layout/CroppingConnectionDocking";
import CommandModule from "diagram-js/lib/command";
import LabelSupportModule from "diagram-js/lib/features/label-support";
import AttachSupportModule from "diagram-js/lib/features/attach-support";
import DirectEditingModule from "diagram-js-direct-editing";

import CustomElementFactory from "./CustomElementFactory";
import CustomUpdater from "./CustomUpdater";
import CustomLabelEditing from "./CustomLabelEditing";
import BehaviorModule from "./behavior";
import CustomModeling from "./CustomModeling";
import ElementFactory from "./ElementFactory";
import CustomLayouter from "./CustomLayouter";

export default {
  __init__: [
    "modeling",
    "elementFactory",
    "customUpdater",
    "customLabelEditing",
  ],
  __depends__: [
    BehaviorModule,
    CommandModule,
    DirectEditingModule,
    LabelSupportModule,
    AttachSupportModule,
  ],
  elementFactory: ["type", ElementFactory],
  customElementFactory: ["type", CustomElementFactory],
  customUpdater: ["type", CustomUpdater],
  customLabelEditing: ["type", CustomLabelEditing],
  modeling: ["type", CustomModeling],
  layouter: ["type", CustomLayouter],
  connectionDocking: ["type", CroppingConnectionDocking],
};
