"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowOperations = exports.FlowOperationRequest = exports.UpdateMinutesSavedRequest = exports.UpdateMetadataRequest = exports.ChangePublishedVersionIdRequest = exports.UpdateFlowStatusRequest = exports.UpdateTriggerRequest = exports.AddActionRequest = exports.MoveActionRequest = exports.DuplicateStepRequest = exports.UpdateActionRequest = exports.DeleteActionRequest = exports.ChangeNameRequest = exports.ChangeFolderRequest = exports.ImportFlowRequest = exports.LockFlowRequest = exports.UseAsDraftRequest = exports.StepLocationRelativeToParent = exports.DuplicateBranchRequest = exports.SkipActionRequest = exports.MoveBranchRequest = exports.AddBranchRequest = exports.DeleteBranchRequest = exports.FlowOperationType = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../../common");
const metadata_1 = require("../../common/metadata");
const action_1 = require("../actions/action");
const flow_1 = require("../flow");
const flow_version_1 = require("../flow-version");
const sample_data_1 = require("../sample-data");
const trigger_1 = require("../triggers/trigger");
const flow_piece_util_1 = require("../util/flow-piece-util");
const flow_structure_util_1 = require("../util/flow-structure-util");
const add_action_1 = require("./add-action");
const add_branch_1 = require("./add-branch");
const copy_action_operations_1 = require("./copy-action-operations");
const delete_action_1 = require("./delete-action");
const delete_branch_1 = require("./delete-branch");
const duplicate_step_1 = require("./duplicate-step");
const import_flow_1 = require("./import-flow");
const move_action_1 = require("./move-action");
const move_branch_1 = require("./move-branch");
const paste_operations_1 = require("./paste-operations");
const skip_action_1 = require("./skip-action");
const update_action_1 = require("./update-action");
const update_trigger_1 = require("./update-trigger");
var FlowOperationType;
(function (FlowOperationType) {
    FlowOperationType["LOCK_AND_PUBLISH"] = "LOCK_AND_PUBLISH";
    FlowOperationType["CHANGE_STATUS"] = "CHANGE_STATUS";
    FlowOperationType["LOCK_FLOW"] = "LOCK_FLOW";
    FlowOperationType["CHANGE_FOLDER"] = "CHANGE_FOLDER";
    FlowOperationType["CHANGE_NAME"] = "CHANGE_NAME";
    FlowOperationType["MOVE_ACTION"] = "MOVE_ACTION";
    FlowOperationType["IMPORT_FLOW"] = "IMPORT_FLOW";
    FlowOperationType["UPDATE_TRIGGER"] = "UPDATE_TRIGGER";
    FlowOperationType["ADD_ACTION"] = "ADD_ACTION";
    FlowOperationType["UPDATE_ACTION"] = "UPDATE_ACTION";
    FlowOperationType["DELETE_ACTION"] = "DELETE_ACTION";
    FlowOperationType["DUPLICATE_ACTION"] = "DUPLICATE_ACTION";
    FlowOperationType["USE_AS_DRAFT"] = "USE_AS_DRAFT";
    FlowOperationType["DELETE_BRANCH"] = "DELETE_BRANCH";
    FlowOperationType["ADD_BRANCH"] = "ADD_BRANCH";
    FlowOperationType["DUPLICATE_BRANCH"] = "DUPLICATE_BRANCH";
    FlowOperationType["SET_SKIP_ACTION"] = "SET_SKIP_ACTION";
    FlowOperationType["UPDATE_METADATA"] = "UPDATE_METADATA";
    FlowOperationType["MOVE_BRANCH"] = "MOVE_BRANCH";
    FlowOperationType["SAVE_SAMPLE_DATA"] = "SAVE_SAMPLE_DATA";
    FlowOperationType["UPDATE_MINUTES_SAVED"] = "UPDATE_MINUTES_SAVED";
})(FlowOperationType || (exports.FlowOperationType = FlowOperationType = {}));
exports.DeleteBranchRequest = typebox_1.Type.Object({
    branchIndex: typebox_1.Type.Number(),
    stepName: typebox_1.Type.String(),
});
exports.AddBranchRequest = typebox_1.Type.Object({
    branchIndex: typebox_1.Type.Number(),
    stepName: typebox_1.Type.String(),
    conditions: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Array(action_1.BranchCondition))),
    branchName: typebox_1.Type.String(),
});
exports.MoveBranchRequest = typebox_1.Type.Object({
    sourceBranchIndex: typebox_1.Type.Number(),
    targetBranchIndex: typebox_1.Type.Number(),
    stepName: typebox_1.Type.String(),
});
exports.SkipActionRequest = typebox_1.Type.Object({
    names: typebox_1.Type.Array(typebox_1.Type.String()),
    skip: typebox_1.Type.Boolean(),
});
exports.DuplicateBranchRequest = typebox_1.Type.Object({
    branchIndex: typebox_1.Type.Number(),
    stepName: typebox_1.Type.String(),
});
var StepLocationRelativeToParent;
(function (StepLocationRelativeToParent) {
    StepLocationRelativeToParent["AFTER"] = "AFTER";
    StepLocationRelativeToParent["INSIDE_LOOP"] = "INSIDE_LOOP";
    StepLocationRelativeToParent["INSIDE_BRANCH"] = "INSIDE_BRANCH";
})(StepLocationRelativeToParent || (exports.StepLocationRelativeToParent = StepLocationRelativeToParent = {}));
exports.UseAsDraftRequest = typebox_1.Type.Object({
    versionId: typebox_1.Type.String(),
});
exports.LockFlowRequest = typebox_1.Type.Object({});
exports.ImportFlowRequest = typebox_1.Type.Object({
    displayName: typebox_1.Type.String({}),
    trigger: trigger_1.FlowTrigger,
    schemaVersion: (0, common_1.Nullable)(typebox_1.Type.String()),
});
exports.ChangeFolderRequest = typebox_1.Type.Object({
    folderId: (0, common_1.Nullable)(typebox_1.Type.String({})),
});
exports.ChangeNameRequest = typebox_1.Type.Object({
    displayName: typebox_1.Type.String({}),
});
exports.DeleteActionRequest = typebox_1.Type.Object({
    names: typebox_1.Type.Array(typebox_1.Type.String()),
});
exports.UpdateActionRequest = typebox_1.Type.Union([
    action_1.CodeActionSchema,
    action_1.LoopOnItemsActionSchema,
    action_1.PieceActionSchema,
    action_1.RouterActionSchema,
]);
exports.DuplicateStepRequest = typebox_1.Type.Object({
    stepName: typebox_1.Type.String(),
});
exports.MoveActionRequest = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    newParentStep: typebox_1.Type.String(),
    stepLocationRelativeToNewParent: typebox_1.Type.Optional(typebox_1.Type.Enum(StepLocationRelativeToParent)),
    branchIndex: typebox_1.Type.Optional(typebox_1.Type.Number()),
});
exports.AddActionRequest = typebox_1.Type.Object({
    parentStep: typebox_1.Type.String(),
    stepLocationRelativeToParent: typebox_1.Type.Optional(typebox_1.Type.Enum(StepLocationRelativeToParent)),
    branchIndex: typebox_1.Type.Optional(typebox_1.Type.Number()),
    action: exports.UpdateActionRequest,
});
exports.UpdateTriggerRequest = typebox_1.Type.Union([trigger_1.EmptyTrigger, trigger_1.PieceTrigger]);
exports.UpdateFlowStatusRequest = typebox_1.Type.Object({
    status: typebox_1.Type.Enum(flow_1.FlowStatus),
});
exports.ChangePublishedVersionIdRequest = typebox_1.Type.Object({
    status: typebox_1.Type.Optional(typebox_1.Type.Enum(flow_1.FlowStatus)),
});
exports.UpdateMetadataRequest = typebox_1.Type.Object({
    metadata: (0, common_1.Nullable)(metadata_1.Metadata),
});
exports.UpdateMinutesSavedRequest = typebox_1.Type.Object({
    timeSavedPerRun: (0, common_1.Nullable)(typebox_1.Type.Number()),
});
exports.FlowOperationRequest = typebox_1.Type.Union([
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.MOVE_ACTION),
        request: exports.MoveActionRequest,
    }, {
        title: 'Move Action',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.CHANGE_STATUS),
        request: exports.UpdateFlowStatusRequest,
    }, {
        title: 'Change Status',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.LOCK_AND_PUBLISH),
        request: exports.ChangePublishedVersionIdRequest,
    }, {
        title: 'Lock and Publish',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.USE_AS_DRAFT),
        request: exports.UseAsDraftRequest,
    }, {
        title: 'Copy as Draft',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.LOCK_FLOW),
        request: exports.LockFlowRequest,
    }, {
        title: 'Lock Flow',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.IMPORT_FLOW),
        request: exports.ImportFlowRequest,
    }, {
        title: 'Import Flow',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.CHANGE_NAME),
        request: exports.ChangeNameRequest,
    }, {
        title: 'Change Name',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.DELETE_ACTION),
        request: exports.DeleteActionRequest,
    }, {
        title: 'Delete Action',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.UPDATE_ACTION),
        request: exports.UpdateActionRequest,
    }, {
        title: 'Update Action',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.ADD_ACTION),
        request: exports.AddActionRequest,
    }, {
        title: 'Add Action',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.UPDATE_TRIGGER),
        request: exports.UpdateTriggerRequest,
    }, {
        title: 'Update Trigger',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.CHANGE_FOLDER),
        request: exports.ChangeFolderRequest,
    }, {
        title: 'Change Folder',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.DUPLICATE_ACTION),
        request: exports.DuplicateStepRequest,
    }, {
        title: 'Duplicate Action',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.DELETE_BRANCH),
        request: exports.DeleteBranchRequest,
    }, {
        title: 'Delete Branch',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.ADD_BRANCH),
        request: exports.AddBranchRequest,
    }, {
        title: 'Add Branch',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.DUPLICATE_BRANCH),
        request: exports.DuplicateBranchRequest,
    }, {
        title: 'Duplicate Branch',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.SET_SKIP_ACTION),
        request: exports.SkipActionRequest,
    }, {
        title: 'Skip Action',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.UPDATE_METADATA),
        request: exports.UpdateMetadataRequest,
    }, {
        title: 'Update Metadata',
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.MOVE_BRANCH),
        request: exports.MoveBranchRequest,
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.SAVE_SAMPLE_DATA),
        request: sample_data_1.SaveSampleDataRequest,
    }),
    typebox_1.Type.Object({
        type: typebox_1.Type.Literal(FlowOperationType.UPDATE_MINUTES_SAVED),
        request: exports.UpdateMinutesSavedRequest,
    }, {
        title: 'Update Minutes Saved',
    }),
]);
exports.flowOperations = {
    getActionsForCopy: copy_action_operations_1._getActionsForCopy,
    getOperationsForPaste: paste_operations_1._getOperationsForPaste,
    apply(flowVersion, operation) {
        let clonedVersion = JSON.parse(JSON.stringify(flowVersion));
        switch (operation.type) {
            case FlowOperationType.MOVE_ACTION: {
                const operations = (0, move_action_1._moveAction)(clonedVersion, operation.request);
                operations.forEach((operation) => {
                    clonedVersion = exports.flowOperations.apply(clonedVersion, operation);
                });
                clonedVersion = flow_piece_util_1.flowPieceUtil.makeFlowAutoUpgradable(clonedVersion);
                break;
            }
            case FlowOperationType.CHANGE_NAME:
                clonedVersion.displayName = operation.request.displayName;
                break;
            case FlowOperationType.DUPLICATE_BRANCH: {
                const operations = (0, duplicate_step_1._duplicateBranch)(operation.request.stepName, operation.request.branchIndex, clonedVersion);
                operations.forEach((operation) => {
                    clonedVersion = exports.flowOperations.apply(clonedVersion, operation);
                });
                break;
            }
            case FlowOperationType.DUPLICATE_ACTION: {
                const operations = (0, duplicate_step_1._duplicateStep)(operation.request.stepName, clonedVersion);
                operations.forEach((operation) => {
                    clonedVersion = exports.flowOperations.apply(clonedVersion, operation);
                });
                break;
            }
            case FlowOperationType.LOCK_FLOW:
                clonedVersion.state = flow_version_1.FlowVersionState.LOCKED;
                break;
            case FlowOperationType.ADD_ACTION: {
                clonedVersion = (0, add_action_1._addAction)(clonedVersion, operation.request);
                clonedVersion = flow_piece_util_1.flowPieceUtil.makeFlowAutoUpgradable(clonedVersion);
                break;
            }
            case FlowOperationType.DELETE_ACTION: {
                clonedVersion = (0, delete_action_1._deleteAction)(clonedVersion, operation.request);
                clonedVersion = flow_piece_util_1.flowPieceUtil.makeFlowAutoUpgradable(clonedVersion);
                break;
            }
            case FlowOperationType.UPDATE_TRIGGER: {
                clonedVersion = (0, update_trigger_1._updateTrigger)(clonedVersion, operation.request);
                clonedVersion = flow_piece_util_1.flowPieceUtil.makeFlowAutoUpgradable(clonedVersion);
                break;
            }
            case FlowOperationType.ADD_BRANCH: {
                clonedVersion = (0, add_branch_1._addBranch)(clonedVersion, operation.request);
                clonedVersion = flow_piece_util_1.flowPieceUtil.makeFlowAutoUpgradable(clonedVersion);
                break;
            }
            case FlowOperationType.DELETE_BRANCH: {
                clonedVersion = (0, delete_branch_1._deleteBranch)(clonedVersion, operation.request);
                clonedVersion = flow_piece_util_1.flowPieceUtil.makeFlowAutoUpgradable(clonedVersion);
                break;
            }
            case FlowOperationType.UPDATE_ACTION: {
                clonedVersion = (0, update_action_1._updateAction)(clonedVersion, operation.request);
                clonedVersion = flow_piece_util_1.flowPieceUtil.makeFlowAutoUpgradable(clonedVersion);
                break;
            }
            case FlowOperationType.IMPORT_FLOW: {
                const operations = (0, import_flow_1._importFlow)(clonedVersion, operation.request);
                operations.forEach((operation) => {
                    clonedVersion = exports.flowOperations.apply(clonedVersion, operation);
                });
                break;
            }
            case FlowOperationType.SET_SKIP_ACTION: {
                clonedVersion = (0, skip_action_1._skipAction)(clonedVersion, operation.request);
                clonedVersion = flow_piece_util_1.flowPieceUtil.makeFlowAutoUpgradable(clonedVersion);
                break;
            }
            case FlowOperationType.MOVE_BRANCH: {
                clonedVersion = (0, move_branch_1._moveBranch)(clonedVersion, operation.request);
                clonedVersion = flow_piece_util_1.flowPieceUtil.makeFlowAutoUpgradable(clonedVersion);
                break;
            }
            default:
                break;
        }
        clonedVersion.valid = flow_structure_util_1.flowStructureUtil.getAllSteps(clonedVersion.trigger).every((step) => {
            const isSkipped = step.type != trigger_1.FlowTriggerType.EMPTY && step.type != trigger_1.FlowTriggerType.PIECE && step.skip;
            return step.valid || isSkipped;
        });
        return clonedVersion;
    },
};
//# sourceMappingURL=index.js.map