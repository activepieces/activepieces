import { FlowActionType, flowStructureUtil, FlowVersion, Step } from '@activepieces/core-execution'
import { unique } from '@activepieces/core-utils'
import { isComponentVisible, isPieceVisible, PieceSetConfig, RequiredActions, RequiredActionsMode } from './index'

function dropUnavailableActionsInLatestPieceVersion({ actions, actionExists }: { actions: ActionsByPiece, actionExists: ActionExistence }): ActionsByPiece {
    return filterActionsPerPiece({ actions, keep: ({ pieceName, actionName }) => actionExists[pieceName]?.[actionName] === true })
}

function removeHiddenRequiredActions({ config, requiredActions }: { config: VisibilityConfig, requiredActions: ActionsByPiece }): ActionsByPiece {
    return filterActionsPerPiece({ actions: requiredActions, keep: ({ pieceName, actionName }) => isActionVisible({ config, pieceName, actionName }) })
}

function findHiddenRequiredActions({ config, requiredActions }: { config: VisibilityConfig, requiredActions: ActionsByPiece }): ActionsByPiece {
    return filterActionsPerPiece({ actions: requiredActions, keep: ({ pieceName, actionName }) => !isActionVisible({ config, pieceName, actionName }) })
}

function checkRequiredActionsExistInFlowVersion({ requiredActions, flowVersion, actionExists }: CheckRequiredActionsExistInFlowVersionParams): RequiredActionsCheckResult {
    const availableRequiredActionsInLatestPieceVersion = dropUnavailableActionsInLatestPieceVersion({ actions: requiredActions.actions, actionExists })
    const required = ungroupActionsByPiece(availableRequiredActionsInLatestPieceVersion)
    if (required.length === 0) {
        return { passed: true, mode: requiredActions.mode, requiredActions: availableRequiredActionsInLatestPieceVersion, missingActions: {}, skippedActions: {} }
    }
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const skippedStepNames = flowStructureUtil.getSkippedStepNames({ trigger: flowVersion.trigger })
    const pieceActionSteps = getPieceActionsInFlowVersion({ steps }).map((ref) => ({ ...ref, skipped: skippedStepNames.has(ref.stepName) }))
    const nonSkippedActionsInFlowVersion = new Set(pieceActionSteps.filter((ref) => !ref.skipped).map(concatPieceNameAndActionName))
    const skippedActionsInFlowVersion = new Set(pieceActionSteps.filter((ref) => ref.skipped).map(concatPieceNameAndActionName))
    const requiredActionsNotInFlowVersion = required.filter((ref) => !nonSkippedActionsInFlowVersion.has(concatPieceNameAndActionName(ref)))
    const passed = requiredActions.mode === RequiredActionsMode.ALL ? requiredActionsNotInFlowVersion.length === 0 : requiredActionsNotInFlowVersion.length < required.length
    return {
        passed,
        mode: requiredActions.mode,
        requiredActions: availableRequiredActionsInLatestPieceVersion,
        missingActions: passed ? {} : groupActionsByPiece(requiredActionsNotInFlowVersion.filter((ref) => !skippedActionsInFlowVersion.has(concatPieceNameAndActionName(ref)))),
        skippedActions: passed ? {} : groupActionsByPiece(requiredActionsNotInFlowVersion.filter((ref) => skippedActionsInFlowVersion.has(concatPieceNameAndActionName(ref)))),
    }
}

function buildRequiredActionsMissingErrorMessage(result: RequiredActionsCheckResult): string {
    const list = [...ungroupActionsByPiece(result.missingActions), ...ungroupActionsByPiece(result.skippedActions)]
        .map((ref) => `${ref.pieceName} · ${ref.actionName}`)
        .join(', ')
    const lead = result.mode === RequiredActionsMode.ALL
        ? 'This flow needs these actions to publish'
        : 'This flow needs one of these actions to publish'
    return `${lead}: ${list}`
}

function getPieceActionsInFlowVersion({ steps }: { steps: Step[] }): (ActionRef & { stepName: string })[] {
    return steps.flatMap((step) => {
        if (step.type !== FlowActionType.PIECE || step.settings.actionName === undefined) {
            return []
        }
        return [{ pieceName: step.settings.pieceName, actionName: step.settings.actionName, stepName: step.name }]
    })
}

function filterActionsPerPiece({ actions, keep }: { actions: ActionsByPiece, keep: (action: ActionRef) => boolean }): ActionsByPiece {
    const keptActionsPerPiece = Object.entries(actions).map(([pieceName, actionNames]) => {
        const keptActionNames = unique(actionNames).filter((actionName) => keep({ pieceName, actionName }))
        return [pieceName, keptActionNames] as const
    })
    const piecesWithKeptActions = keptActionsPerPiece.filter(([, actionNames]) => actionNames.length > 0)
    return Object.fromEntries(piecesWithKeptActions)
}

function isActionVisible({ config, pieceName, actionName }: { config: VisibilityConfig } & ActionRef): boolean {
    return isPieceVisible({ pieces: config.pieces, name: pieceName })
        && isComponentVisible({ selected: config.selectedActions[pieceName], name: actionName })
}

function ungroupActionsByPiece(actions: ActionsByPiece): ActionRef[] {
    return Object.entries(actions).flatMap(([pieceName, names]) => names.map((actionName) => ({ pieceName, actionName })))
}

function groupActionsByPiece(refs: ActionRef[]): ActionsByPiece {
    return refs.reduce<ActionsByPiece>((acc, ref) => ({ ...acc, [ref.pieceName]: [...(acc[ref.pieceName] ?? []), ref.actionName] }), {})
}

function concatPieceNameAndActionName(ref: ActionRef): string {
    return `${ref.pieceName}--${ref.actionName}`
}

export const requiredActionsUtil = {
    checkRequiredActionsExistInFlowVersion,
    buildRequiredActionsMissingErrorMessage,
    dropUnavailableActionsInLatestPieceVersion,
    removeHiddenRequiredActions,
    findHiddenRequiredActions,
}

type ActionsByPiece = Record<string, string[]>

type ActionExistence = Record<string, Record<string, boolean>>

type ActionRef = {
    pieceName: string
    actionName: string
}

type CheckRequiredActionsExistInFlowVersionParams = {
    requiredActions: RequiredActions
    flowVersion: FlowVersion
    actionExists: ActionExistence
}

export type VisibilityConfig = Pick<PieceSetConfig, 'pieces' | 'selectedActions'>

export type RequiredActionsCheckResult = {
    passed: boolean
    mode: RequiredActionsMode
    requiredActions: ActionsByPiece
    missingActions: ActionsByPiece
    skippedActions: ActionsByPiece
}
