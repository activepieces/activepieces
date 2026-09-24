import { isNil } from '@activepieces/core-utils'
import { FlowAction, FlowActionType, flowStructureUtil, FlowTrigger, FlowTriggerType, FlowVersion } from '@activepieces/shared'
import { Migration } from '.'

export const migrateV27PieceVersionUpgrades: Migration = {
    targetSchemaVersion: '27',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            const stepIsPiece = step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE
            if (!stepIsPiece) {
                return step
            }
            const target = UPGRADE_TARGETS.get(step.settings.pieceName)?.get(step.settings.pieceVersion)
            if (target === undefined) {
                return step
            }
            if (sendsGetRequestWithBody(step)) {
                return step
            }
            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: target,
                },
            }
        })
        return { ...newVersion, schemaVersion: '28' }
    },
}

function sendsGetRequestWithBody(step: FlowAction | FlowTrigger): boolean {
    if (step.type !== FlowActionType.PIECE || !isGuardedActionName(step.settings.pieceName, step.settings.actionName)) {
        return false
    }
    const input = step.settings.input as Record<string, unknown> | undefined
    if (isNil(input)) {
        return false
    }
    if (isEmptyRequestBody(input.body)) {
        return false
    }
    return methodCouldBeGet(input.method)
}

function methodCouldBeGet(method: unknown): boolean {
    if (typeof method !== 'string') {
        return true
    }
    const normalized = method.trim().toUpperCase()
    if (normalized === 'GET') {
        return true
    }
    if (KNOWN_NON_GET_METHODS.has(normalized)) {
        return false
    }
    return true
}

function isGuardedActionName(pieceName: string, actionName: string | undefined): boolean {
    if (actionName === CUSTOM_API_CALL_ACTION_NAME) {
        return true
    }
    return pieceName === HTTP_PIECE_NAME && actionName === HTTP_SEND_REQUEST_ACTION_NAME
}

function isEmptyRequestBody(body: unknown): boolean {
    if (isNil(body)) {
        return true
    }
    if (typeof body === 'string') {
        return body.trim().length === 0
    }
    if (typeof body === 'object' && body !== null) {
        return Object.keys(body).length === 0
    }
    return false
}

const CUSTOM_API_CALL_ACTION_NAME = 'custom_api_call'
const HTTP_PIECE_NAME = '@activepieces/piece-http'
const HTTP_SEND_REQUEST_ACTION_NAME = 'send_request'
const KNOWN_NON_GET_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
const HTTP_TARGET = '0.11.21'
const SLACK_PIECE_NAME = '@activepieces/piece-slack'
const SLACK_TARGET = '0.17.9'

const UPGRADE_TARGETS: Map<string, Map<string, string>> = new Map([
    [
        HTTP_PIECE_NAME,
        new Map([
            '0.8.4',
            '0.8.6',
            '0.8.7',
            '0.11.0',
            '0.11.1',
            '0.11.2',
            '0.11.4',
            '0.11.5',
            '0.11.6',
            '0.11.7',
            '0.11.8',
            '0.11.9',
            '0.11.10',
        ].map((v) => [v, HTTP_TARGET])),
    ],
    [
        SLACK_PIECE_NAME,
        new Map([
            '0.15.0',
            '0.16.0',
            '0.16.1',
            '0.16.2',
            '0.16.3',
            '0.16.4',
        ].map((v) => [v, SLACK_TARGET])),
    ],
])
