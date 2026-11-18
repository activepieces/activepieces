import { FlowActionType, flowStructureUtil, FlowVersion, Step } from '@activepieces/core-execution'
import { unique } from '@activepieces/core-utils'
import { isComponentVisible, isPieceVisible, PieceSetConfig, RequiredActions, RequiredActionsMode } from './index'

function dropUnavailableActionsInLatestPieceVersion({ actions, actionExists }: { actions: ActionsGroupedByPiece, actionExists: ActionExistence }): ActionsGroupedByPiece {
    return filterActionsPerPiece({ actions, keep: ({ pieceName, actionName }) => actionExists[pieceName]?.[actionName] === true })
}

function removeExcludedRequiredActions({ config, requiredActions }: { config: PieceSetConfig, requiredActions: ActionsGroupedByPiece }): ActionsGroupedByPiece {
    return filterActionsPerPiece({ actions: requiredActions, keep: ({ pieceName, actionName }) => isActionIncluded({ config, pieceName, actionName }) })
}

function findExcludedRequiredActions({ config, requiredActions }: { config: PieceSetConfig, requiredActions: ActionsGroupedByPiece }): ActionsGroupedByPiece {
    return filterActionsPerPiece({ actions: requiredActions, keep: ({ pieceName, actionName }) => !isActionIncluded({ config, pieceName, actionName }) })
}

function checkRequiredActionsExistInFlowVersion({ requiredActions, flowVersion, actionExists }: CheckRequiredActionsExistInFlowVersionParams): RequiredActionsCheckResult {
    const availableRequiredActionsInLatestPieceVersion = dropUnavailableActionsInLatestPieceVersion({ actions: requiredActions.actions, actionExists })
    const required = ungroupActionsByPiece(availableRequiredActionsInLatestPieceVersion)
    if (required.length === 0) {
        return { passed: true, mode: requiredActions.mode, requiredActions: availableRequiredActionsInLatestPieceVersion, missingActions: {}, skippedActions: {} }
    }
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const skippedStepNames = flowStructureUtil.getSkippedStepNames({ trigger: flowVersion.trigger })
    const pieceActionSteps = getPieceActionsInFlowVersion({ steps }).map((step) => ({ ...step, skipped: skippedStepNames.has(step.stepName) }))
    const nonSkippedActionsInFlowVersion = new Set(pieceActionSteps.filter((step) => !step.skipped).map(concatPieceNameAndActionName))
    const skippedActionsInFlowVersion = new Set(pieceActionSteps.filter((step) => step.skipped).map(concatPieceNameAndActionName))
    const requiredActionsNotInFlowVersion = required.filter((step) => !nonSkippedActionsInFlowVersion.has(concatPieceNameAndActionName(step)))
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
    const list = formatActionList([...ungroupActionsByPiece(result.missingActions), ...ungroupActionsByPiece(result.skippedActions)])
    const lead = result.mode === RequiredActionsMode.ALL
        ? 'This flow needs these actions to publish'
        : 'This flow needs one of these actions to publish'
    return `${lead}: ${list}`
}

function buildExcludedRequiredActionsErrorMessage(excludedRequiredActions: ActionsGroupedByPiece): string {
    return `Required actions must be included in the piece set: ${formatActionList(ungroupActionsByPiece(excludedRequiredActions))}`
}

function formatActionList(refs: ActionAndPieceNames[]): string {
    return refs
        .map((ref) => `${ref.pieceName} · ${ref.actionName}`)
        .join(', ')
}

function getPieceActionsInFlowVersion({ steps }: { steps: Step[] }): (ActionAndPieceNames & { stepName: string })[] {
    return steps.flatMap((step) => {
        if (step.type !== FlowActionType.PIECE || step.settings.actionName === undefined) {
            return []
        }
        return [{ pieceName: step.settings.pieceName, actionName: step.settings.actionName, stepName: step.name }]
    })
}

function filterActionsPerPiece({ actions, keep }: { actions: ActionsGroupedByPiece, keep: (action: ActionAndPieceNames) => boolean }): ActionsGroupedByPiece {
    const keptActionsPerPiece = Object.entries(actions).map(([pieceName, actionNames]) => {
        const keptActionNames = unique(actionNames).filter((actionName) => keep({ pieceName, actionName }))
        return [pieceName, keptActionNames] as const
    })
    const piecesWithKeptActions = keptActionsPerPiece.filter(([, actionNames]) => actionNames.length > 0)
    return Object.fromEntries(piecesWithKeptActions)
}

function isActionIncluded({ config, pieceName, actionName }: { config: PieceSetConfig } & ActionAndPieceNames): boolean {
    return isPieceVisible({ pieces: config.pieces, name: pieceName })
        && isComponentVisible({ selected: config.selectedActions[pieceName], name: actionName })
}

function ungroupActionsByPiece(actions: ActionsGroupedByPiece): ActionAndPieceNames[] {
    return Object.entries(actions).flatMap(([pieceName, names]) => names.map((actionName) => ({ pieceName, actionName })))
}

function groupActionsByPiece(refs: ActionAndPieceNames[]): ActionsGroupedByPiece {
    return refs.reduce<ActionsGroupedByPiece>((acc, ref) => ({ ...acc, [ref.pieceName]: [...(acc[ref.pieceName] ?? []), ref.actionName] }), {})
}

function concatPieceNameAndActionName(ref: ActionAndPieceNames): string {
    return JSON.stringify([ref.pieceName, ref.actionName])
}

export const requiredActionsUtil = {
    checkRequiredActionsExistInFlowVersion,
    buildRequiredActionsMissingErrorMessage,
    buildExcludedRequiredActionsErrorMessage,
    removeExcludedRequiredActions,
    findExcludedRequiredActions,
}

type ActionsGroupedByPiece = Record<string, string[]>

type ActionAndPieceNames = {
    pieceName: string
    actionName: string
}

type CheckRequiredActionsExistInFlowVersionParams = {
    requiredActions: RequiredActions
    flowVersion: FlowVersion
    actionExists: ActionExistence
}

export type ActionExistence = Record<string, Record<string, boolean>>

export type RequiredActionsCheckResult = {
    passed: boolean
    mode: RequiredActionsMode
    requiredActions: ActionsGroupedByPiece
    missingActions: ActionsGroupedByPiece
    skippedActions: ActionsGroupedByPiece
}
