import { isNil } from '@activepieces/core-utils'
import { FlowActionType, FlowTriggerType, Step } from '@activepieces/shared'

export function getPieceComponentInfoForStep(step: Step): PieceComponentInfo | undefined {
    if (step.type === FlowTriggerType.PIECE && !isNil(step.settings.triggerName)) {
        return {
            pieceName: step.settings.pieceName,
            pieceVersion: step.settings.pieceVersion,
            componentType: 'trigger',
            componentName: step.settings.triggerName,
        }
    }
    if (step.type === FlowActionType.PIECE && !isNil(step.settings.actionName)) {
        return {
            pieceName: step.settings.pieceName,
            pieceVersion: step.settings.pieceVersion,
            componentType: 'action',
            componentName: step.settings.actionName,
        }
    }
    return undefined
}

export type PieceComponentInfo = {
    pieceName: string
    pieceVersion: string
    componentType: 'action' | 'trigger'
    componentName: string
}
