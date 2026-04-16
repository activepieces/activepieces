import {
    AUTHENTICATION_PROPERTY_NAME,
    EngineResponse,
    EngineResponseStatus,
    ExecuteActionOperation,
    ExecuteActionResponse,
    ExecutionType,
    isNil,
} from '@activepieces/shared'
import { ActionContext, backwardCompatabilityContextUtils, InputPropertyMap, PieceAuthProperty } from '@activepieces/pieces-framework'
import { pieceLoader } from '../helper/piece-loader'
import { createContextStore } from '../piece-context/store'
import { createFlowsContext } from '../piece-context/flows'
import { createFileUploader } from '../piece-context/file-uploader'
import { utils } from '../utils'
import { propsProcessor } from '../variables/props-processor'
import { EngineConstants } from '../handler/context/engine-constants'

export const actionOperation = {
    execute: async (operation: ExecuteActionOperation): Promise<EngineResponse<ExecuteActionResponse>> => {
        const { piece: piecePackage, actionName, input } = operation

        const { pieceAction, piece } = await pieceLoader.getPieceAndActionOrThrow({
            pieceName: piecePackage.pieceName,
            pieceVersion: piecePackage.pieceVersion,
            actionName,
            devPieces: EngineConstants.DEV_PIECES,
        })

        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
            input,
            pieceAction.props,
            piece.auth,
            pieceAction.requireAuth,
            {},
        )

        if (Object.keys(errors).length > 0) {
            return {
                status: EngineResponseStatus.OK,
                response: {
                    success: false,
                    input,
                    output: null,
                    message: JSON.stringify(errors),
                },
            }
        }

        const context: ActionContext<PieceAuthProperty, InputPropertyMap> = {
            executionType: ExecutionType.BEGIN,
            resumePayload: undefined,
            store: createContextStore({
                apiUrl: operation.internalApiUrl,
                prefix: '',
                flowId: 'single-execution',
                engineToken: operation.engineToken,
            }),
            output: {
                pause: () => { throw new Error('Pause is not supported in single action execution') },
                stop: () => { throw new Error('Stop is not supported in single action execution') },
            },
            flows: createFlowsContext({
                engineToken: operation.engineToken,
                internalApiUrl: operation.internalApiUrl,
                flowId: 'single-execution',
                flowVersionId: 'single-execution',
            }),
            step: {
                name: actionName,
            },
            auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
            files: createFileUploader({
                apiUrl: operation.internalApiUrl,
                engineToken: operation.engineToken,
                stepName: actionName,
                flowId: 'single-execution',
            }),
            server: {
                token: operation.engineToken,
                apiUrl: operation.internalApiUrl,
                publicUrl: operation.publicApiUrl,
            },
            propsValue: processedInput,
            tags: { add: async () => {} },
            connections: utils.createConnectionManager({
                apiUrl: operation.internalApiUrl,
                projectId: operation.projectId,
                engineToken: operation.engineToken,
                target: 'actions',
                contextVersion: piece.getContextInfo?.().version,
            }),
            run: {
                id: 'single-execution',
                stop: () => {},
                respond: () => {},
                createWaitpoint: () => { throw new Error('Waitpoints are not supported in single action execution') },
                waitForWaitpoint: () => { throw new Error('Waitpoints are not supported in single action execution') },
            },
            project: {
                id: operation.projectId,
            },
        }

        const backwardCompatibleContext = backwardCompatabilityContextUtils.makeActionContextBackwardCompatible({
            contextVersion: piece.getContextInfo?.().version,
            context,
        })

        try {
            const runMethodToExecute = (!isNil(operation.stepNameToTest) && !isNil(pieceAction.test)) ? pieceAction.test : pieceAction.run
            const output = await runMethodToExecute(backwardCompatibleContext)
            return {
                status: EngineResponseStatus.OK,
                response: {
                    success: true,
                    input: processedInput,
                    output,
                },
            }
        } catch (e: any) {
            return {
                status: EngineResponseStatus.OK,
                response: {
                    success: false,
                    input: processedInput,
                    output: null,
                    message: e.message,
                },
            }
        }
    },
}
