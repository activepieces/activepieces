import { apId, isNil, unique } from '@activepieces/core-utils'
import { ComponentSelection, PieceSelectionMode, PieceSetConfig, RequiredActions, RequiredActionsMode, requiredActionsUtil, UpdatePieceSetRequestBody, VisibilityConfig } from '@activepieces/shared'

export const pieceSetConfig = {
    buildDefaultSet(platformId: string) {
        return {
            id: apId(),
            platformId,
            name: 'Default',
            key: 'default',
            isDefault: true,
            generatedForProjectId: null,
            config: emptyConfig(),
        }
    },

    emptyConfig,

    applyUpdate({ current, request }: { current: PieceSetConfig, request: UpdatePieceSetRequestBody }): PieceSetConfig {
        const visibility = {
            pieces: request.pieces ?? current.pieces,
            selectedActions: applyComponentSelections({ current: current.selectedActions, selections: request.actions }),
            selectedTriggers: applyComponentSelections({ current: current.selectedTriggers, selections: request.triggers }),
        }
        return {
            ...visibility,
            requiredActions: applyRequiredActionsUpdate({ current: current.requiredActions, request: request.requiredActions, visibility }),
        }
    },
}

function emptyConfig(): PieceSetConfig {
    return {
        pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
        selectedActions: {},
        selectedTriggers: {},
        requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
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

function applyRequiredActionsUpdate({ current, request, visibility }: { current: RequiredActions, request: UpdatePieceSetRequestBody['requiredActions'], visibility: VisibilityConfig }): RequiredActions {
    return {
        mode: request?.mode ?? current.mode,
        actions: requiredActionsUtil.removeHiddenRequiredActions({
            config: visibility,
            requiredActions: { ...current.actions, ...request?.actions },
        }),
    }
}

type SelectedComponents = Record<string, string[]>
