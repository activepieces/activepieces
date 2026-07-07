import { apId, isNil, unique } from '@activepieces/core-utils'
import { ComponentIntent, PieceSetConfig, UpdatePieceSetRequestBody } from '@activepieces/shared'

export const pieceSetConfig = {
    buildDefaultSet(platformId: string) {
        return {
            id: apId(),
            platformId,
            name: 'Default',
            externalId: 'default',
            isDefault: true,
            generatedForProjectId: null,
            config: emptyConfig(),
        }
    },

    emptyConfig,

    applyUpdate({ current, request }: { current: PieceSetConfig, request: UpdatePieceSetRequestBody }): PieceSetConfig {
        return {
            pieces: request.pieces ?? current.pieces,
            selectedActions: applyComponentIntents({ current: current.selectedActions, intents: request.actions }),
            selectedTriggers: applyComponentIntents({ current: current.selectedTriggers, intents: request.triggers }),
        }
    },
}

function emptyConfig(): PieceSetConfig {
    return {
        pieces: { mode: 'include_all', exceptions: [] },
        selectedActions: {},
        selectedTriggers: {},
    }
}

function applyComponentIntents({ current, intents }: { current: ComponentMap, intents: Record<string, ComponentIntent> | undefined }): ComponentMap {
    if (isNil(intents)) {
        return current
    }
    return Object.entries(intents).reduce<ComponentMap>((acc, [piece, intent]) => {
        if (intent.mode === 'all') {
            return Object.fromEntries(Object.entries(acc).filter(([key]) => key !== piece))
        }
        return { ...acc, [piece]: unique(intent.selected) }
    }, current)
}

type ComponentMap = Record<string, string[]>
