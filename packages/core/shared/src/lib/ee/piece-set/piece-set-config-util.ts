import { apId, isNil, unique } from '@activepieces/core-utils'
import { requiredActionsUtil } from './required-actions-util'
import { ComponentSelection, PieceSelectionMode, PieceSetConfig, RequiredActions, RequiredActionsMode, UpdatePieceSetRequestBody } from './index'

function buildDefaultSet(platformId: string) {
    return {
        id: apId(),
        platformId,
        name: 'Default',
        key: 'default',
        isDefault: true,
        generatedForProjectId: null,
        config: emptyConfig(),
    }
}

function emptyConfig(): PieceSetConfig {
    return {
        pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
        selectedActions: {},
        selectedTriggers: {},
        requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
    }
}

function applyUpdate({ current, request }: { current: PieceSetConfig, request: UpdatePieceSetRequestBody }): PieceSetConfig {
    const configWithUpdatedVisibility: PieceSetConfig = {
        ...current,
        pieces: request.pieces ?? current.pieces,
        selectedActions: applyComponentSelections({ current: current.selectedActions, selections: request.actions }),
        selectedTriggers: applyComponentSelections({ current: current.selectedTriggers, selections: request.triggers }),
    }
    return {
        ...configWithUpdatedVisibility,
        requiredActions: applyRequiredActionsUpdate({ config: configWithUpdatedVisibility, request: request.requiredActions }),
    }
}

function applyComponentSelections({ current, selections }: { current: SelectedComponents, selections: Record<string, ComponentSelection> | undefined }): SelectedComponents {
    if (isNil(selections)) {
        return current
    }
    return Object.entries(selections).reduce<SelectedComponents>((acc, [piece, selection]) => {
        if (selection.mode === 'all') {
            return Object.fromEntries(Object.entries(acc).filter(([key]) => key !== piece))
        }
        return { ...acc, [piece]: unique(selection.selected) }
    }, current)
}

function applyRequiredActionsUpdate({ config, request }: { config: PieceSetConfig, request: UpdatePieceSetRequestBody['requiredActions'] }): RequiredActions {
    const current = config.requiredActions
    return {
        mode: request?.mode ?? current.mode,
        actions: requiredActionsUtil.removeHiddenRequiredActions({
            config,
            requiredActions: { ...current.actions, ...request?.actions },
        }),
    }
}

export const pieceSetConfigUtil = {
    buildDefaultSet,
    emptyConfig,
    applyUpdate,
}

type SelectedComponents = Record<string, string[]>
