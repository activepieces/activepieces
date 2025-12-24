"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addActionUtils = void 0;
const common_1 = require("../../common");
const flow_structure_util_1 = require("../util/flow-structure-util");
function mapToNewNames(flowVersion, clonedActions) {
    const existingNames = flow_structure_util_1.flowStructureUtil.getAllSteps(flowVersion.trigger)
        .map(step => step.name);
    const oldStepNames = clonedActions.flatMap(clonedAction => flow_structure_util_1.flowStructureUtil.getAllSteps(clonedAction).map(step => step.name));
    return oldStepNames.reduce((nameMap, oldName) => {
        const newName = flow_structure_util_1.flowStructureUtil.findUnusedName(existingNames);
        existingNames.push(newName);
        return Object.assign(Object.assign({}, nameMap), { [oldName]: newName });
    }, {});
}
function replaceOldStepNameWithNewOne({ input, oldStepName, newStepName, }) {
    const regex = /{{(.*?)}}/g; // Regular expression to match strings inside {{ }}
    return input.replace(regex, (match, content) => {
        // Replace the content inside {{ }} using the provided function
        const replacedContent = content.replaceAll(new RegExp(`\\b${oldStepName}\\b`, 'g'), `${newStepName}`);
        // Reconstruct the {{ }} with the replaced content
        return `{{${replacedContent}}}`;
    });
}
function clone(step, oldNameToNewName) {
    step.displayName = `${step.displayName} Copy`;
    step.name = oldNameToNewName[step.name];
    if ('input' in step.settings) {
        Object.keys(oldNameToNewName).forEach((oldName) => {
            const settings = step.settings;
            settings.input = (0, common_1.applyFunctionToValuesSync)(settings.input, (value) => {
                if ((0, common_1.isString)(value)) {
                    return replaceOldStepNameWithNewOne({
                        input: value,
                        oldStepName: oldName,
                        newStepName: oldNameToNewName[oldName],
                    });
                }
                return value;
            });
        });
    }
    if (step.settings.sampleData) {
        step.settings = Object.assign(Object.assign({}, step.settings), { sampleData: Object.assign(Object.assign({}, step.settings.sampleData), { sampleDataFileId: undefined, sampleDataInputFileId: undefined, lastTestDate: undefined }) });
    }
    return step;
}
exports.addActionUtils = {
    mapToNewNames,
    clone,
};
//# sourceMappingURL=add-action-util.js.map