import semver from 'semver'
import { ActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { Trigger, TriggerType } from '../triggers/trigger'
import { flowStructureUtil, Step } from '../util/flow-structure-util'

function upgradeStep(step: Step, stepName: string): Step {
    if (step.name !== stepName) {
        return step
    }
    const clonedStep: Step = JSON.parse(JSON.stringify(step))
    switch (step.type) {
        case ActionType.PIECE:
        case TriggerType.PIECE: {
            const { pieceVersion } = step.settings
            if (pieceVersion.startsWith('^') || pieceVersion.startsWith('~')) {
                return step
            }
            if (semver.valid(pieceVersion) && semver.lt(pieceVersion, '1.0.0')) {
                clonedStep.settings.pieceVersion = `~${pieceVersion}`
            }
            else {
                clonedStep.settings.pieceVersion = `^${pieceVersion}`
            }
            break
        }
        default:
            break
    }
    return clonedStep
}

function getUsedPieces(trigger: Trigger): string[] {
    return flowStructureUtil.getAllSteps(trigger)
        .filter((step) => step.type === ActionType.PIECE || step.type === TriggerType.PIECE)
        .map((step) => step.settings.pieceVersion)
}


export const flowPieceUtil = {
    makeFlowAutoUpgradable(flowVersion: FlowVersion): FlowVersion {
        return flowStructureUtil.transferFlow(flowVersion, (step) => upgradeStep(step, step.name))
    },
    getUsedPieces,
}