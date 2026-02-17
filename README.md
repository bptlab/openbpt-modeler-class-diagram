# openbpt-modeler-template

Template repository for the creation of modelers used in the OpenBPT project.
The template is a generalization of the [ptn-js](https://github.com/MaximilianKoenig/ptn-js) modeler. It is based on [diagram-js](https://github.com/bpmn-io/diagram-js) and took inspiration from [bpmn-js](https://github.com/bpmn-io/bpmn-js), [object-diagram-js](https://github.com/timKraeuter/object-diagram-js) and [fcm-js](https://github.com/bptlab/fCM-design-support).

The template showcases a working version of a basic Petri net modeler whose elements should be replaced with the elements of the new modeling language. For that purpose, fork the repository and follow the steps outlined below.
**If you create a new modeler and implement additional features that could be generalized to fit any modeler, please feel free to create a pull request so that others may profit from your extension as well!**

## Development Setup

- link to demo-repo
- use npm link

## Implementing a New Modeler

Implementing a new modeler requires the definition of the metamodel of the modeling language, a custom renderer, a set of icons, and a few adaptations in the modeler itself. In general, the keyword **CustomModelerTodo** marks places in the code that require adaptation.

### Defining the Metamodel

To define the model structure, we build on [moddle](https://github.com/bpmn-io/moddle), which uses a schema defined as a JSON file to create a meta model that can be used to instantiate model elements while knowing their attributes and relations and provides a structure for importing and exporting XML files.
The followning class diagram shows the currently implemented metamodel used in the modeler. It can be generally divided into two sides:

- The *semantic* elements are the classes on the left, everything inheriting from `Schema`. They define the different model elements and their attributes/relations.
- The *syntactic* elements are the classes on the right, everything inheriting from `DiagramElement` as well as `Diagram` and `Plane`. These elements are visual representatoions of the model elements, including positional information and associated labels.

![Moddle_Class_Diagram](https://github.com/user-attachments/assets/465970e3-e9ab-4c4b-b243-0a61c9277a8a)

In most cases, it should not be necessary to modify the metamodel of the *syntactic* elements. For the *semantic* elements, the classes inheriting from `Node` and `BinaryConnection` (marked in red) must be defined for the respective modeling language in [modelSchema.js](https://github.com/bptlab/openbpt-modeler-template/blob/main/lib/moddle/resources/modelSchema.js). A documentation can be found [here](https://github.com/bpmn-io/moddle/blob/main/docs/descriptor.md). Setting `isAttr` for a property will include it as an attribute in the XML, otherwise it is a separate child-tag.

### Creating a Custom Renderer

### Adding Icons

To include your own icons in the palette and context pads, create plain SVG files and places them in the `assets/icons` folder. Make sure to use descriptive names, as file names will be used as icon identifiers. Afterwards, execute `npm run build:icons` to generate the image URLs that will be used by diagram.js to render the icons.

### Adapting the Modeler
