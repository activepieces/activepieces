import { EngineConstants } from '../handler/context/engine-constants'
import { pieceHelper } from '../helper/piece-helper'
import { pieceLoader } from '../helper/piece-loader'
import { triggerHelper } from '../helper/trigger-helper'
import { serializeEngineError } from './error-serde'
import {
    ExecuteOnStartHostParams,
    ExecutePropsParams,
    ExecuteRefreshTokenAuthHostParams,
    ExecuteResolveConnectionIdentifierHostParams,
    ExecuteTriggerHostParams,
    ExecuteValidateAuthHostParams,
    ExtractPieceMetadataHostParams,
    GetContextVersionParams,
    PieceHostRequest,
    PieceHostResponse,
    RunActionParams,
} from './piece-process-types'
import { runActionCore } from './run-action-core'

async function dispatch(request: PieceHostRequest): Promise<unknown> {
    switch (request.method) {
        case 'getContextVersion': {
            const params = request.params as GetContextVersionParams
            const piece = await pieceLoader.loadPieceOrThrow({ pieceName: params.pieceName, pieceVersion: params.pieceVersion, devPieces: params.devPieces })
            return piece.getContextInfo?.().version
        }
        case 'runAction': {
            return runActionCore(request.params as RunActionParams)
        }
        case 'executeTrigger': {
            const params = request.params as ExecuteTriggerHostParams
            return triggerHelper.executeTrigger({ params: params.params, constants: new EngineConstants(params.constantsParams) })
        }
        case 'executeOnStart': {
            const params = request.params as ExecuteOnStartHostParams
            return triggerHelper.executeOnStart(params.trigger, new EngineConstants(params.constantsParams), params.payload)
        }
        case 'executeProps': {
            return pieceHelper.executeProps(request.params as ExecutePropsParams)
        }
        case 'executeValidateAuth': {
            return pieceHelper.executeValidateAuth(request.params as ExecuteValidateAuthHostParams)
        }
        case 'executeResolveConnectionIdentifier': {
            return pieceHelper.executeResolveConnectionIdentifier(request.params as ExecuteResolveConnectionIdentifierHostParams)
        }
        case 'executeRefreshTokenAuth': {
            return pieceHelper.executeRefreshTokenAuth(request.params as ExecuteRefreshTokenAuthHostParams)
        }
        case 'extractPieceMetadata': {
            return pieceHelper.extractPieceMetadata(request.params as ExtractPieceMetadataHostParams)
        }
    }
}

async function handleRequest(request: PieceHostRequest): Promise<void> {
    let response: PieceHostResponse
    try {
        const result = await dispatch(request)
        response = { id: request.id, ok: true, result: result === undefined ? null : JSON.parse(JSON.stringify(result)) }
    }
    catch (error) {
        response = { id: request.id, ok: false, error: serializeEngineError(error) }
    }
    process.send?.(response)
}

export const pieceHostMain = {
    start: (): void => {
        process.on('message', (request: PieceHostRequest) => {
            void handleRequest(request)
        })
        // If the parent engine dies (SIGKILL / OOM), the IPC channel closes — self-exit
        // instead of lingering as an orphan holding piece modules.
        process.on('disconnect', () => process.exit(0))
    },
}
