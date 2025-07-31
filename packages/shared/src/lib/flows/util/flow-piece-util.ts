import semver from 'semver'
import { ActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { Trigger, TriggerType } from '../triggers/trigger'
import { flowStructureUtil, Step } from '../util/flow-structure-util'

export const flowPieceUtil = {
    makeFlowAutoUpgradable(flowVersion: FlowVersion): FlowVersion {
        return flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.name !== step.name) {
                return step
            }
            const clonedStep: Step = JSON.parse(JSON.stringify(step))
            switch (step.type) {
                case ActionType.PIECE:
                case TriggerType.PIECE: {
                    const { pieceVersion } = step.settings
                    clonedStep.settings.pieceVersion = flowPieceUtil.getMostRecentPatchVersion(pieceVersion)
                    break
                }
                default:
                    break
            }
            return clonedStep
        })
    },
    getExactVersion(pieceVersion: string): string {
        if (pieceVersion.startsWith('^') || pieceVersion.startsWith('~')) {
            return pieceVersion.slice(1)
        }
        return pieceVersion
    },
    getUsedPieces(trigger: Trigger): string[] {
        return flowStructureUtil.getAllSteps(trigger)
            .filter((step) => step.type === ActionType.PIECE || step.type === TriggerType.PIECE)
            .map((step) => step.settings.pieceName)
    },
    getMostRecentPatchVersion(pieceVersion: string): string {
        if (pieceVersion.startsWith('^') || pieceVersion.startsWith('~')) {
            return pieceVersion
        }
        if (semver.valid(pieceVersion) && semver.lt(pieceVersion, '1.0.0')) {
            return `~${pieceVersion}`
        }
        return `^${pieceVersion}`
    },
}