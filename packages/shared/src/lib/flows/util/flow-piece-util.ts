import semver from 'semver'
import { FlowActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { FlowTrigger, FlowTriggerType } from '../triggers/trigger'
import { flowStructureUtil, Step } from '../util/flow-structure-util'

export const flowPieceUtil = {
    makeFlowAutoUpgradable(flowVersion: FlowVersion): FlowVersion {
        return flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.name !== step.name) {
                return step
            }
            const clonedStep: Step = JSON.parse(JSON.stringify(step))
            switch (step.type) {
                case FlowActionType.PIECE:
                case FlowTriggerType.PIECE: {
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
    getUsedPieces(trigger: FlowTrigger): string[] {
        return flowStructureUtil.getAllSteps(trigger)
            .filter((step) => step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE)
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