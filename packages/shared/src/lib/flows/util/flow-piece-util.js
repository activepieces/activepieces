"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowPieceUtil = void 0;
const tslib_1 = require("tslib");
const semver_1 = tslib_1.__importDefault(require("semver"));
const action_1 = require("../actions/action");
const trigger_1 = require("../triggers/trigger");
const flow_structure_util_1 = require("../util/flow-structure-util");
exports.flowPieceUtil = {
    makeFlowAutoUpgradable(flowVersion) {
        return flow_structure_util_1.flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.name !== step.name) {
                return step;
            }
            const clonedStep = JSON.parse(JSON.stringify(step));
            switch (step.type) {
                case action_1.FlowActionType.PIECE:
                case trigger_1.FlowTriggerType.PIECE: {
                    const { pieceVersion } = step.settings;
                    clonedStep.settings.pieceVersion = exports.flowPieceUtil.getMostRecentPatchVersion(pieceVersion);
                    break;
                }
                default:
                    break;
            }
            return clonedStep;
        });
    },
    getExactVersion(pieceVersion) {
        if (pieceVersion.startsWith('^') || pieceVersion.startsWith('~')) {
            return pieceVersion.slice(1);
        }
        return pieceVersion;
    },
    getUsedPieces(trigger) {
        return flow_structure_util_1.flowStructureUtil.getAllSteps(trigger)
            .filter((step) => step.type === action_1.FlowActionType.PIECE || step.type === trigger_1.FlowTriggerType.PIECE)
            .map((step) => step.settings.pieceName);
    },
    getMostRecentPatchVersion(pieceVersion) {
        if (pieceVersion.startsWith('^') || pieceVersion.startsWith('~')) {
            return pieceVersion;
        }
        if (semver_1.default.valid(pieceVersion) && semver_1.default.lt(pieceVersion, '1.0.0')) {
            return `~${pieceVersion}`;
        }
        return `^${pieceVersion}`;
    },
};
//# sourceMappingURL=flow-piece-util.js.map