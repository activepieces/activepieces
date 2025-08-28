import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { apVersionUtil } from '@activepieces/server-shared'
import {
    AddActionRequest,
    ApEdition,
    assertNotNullOrUndefined,
    DeleteActionRequest,
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    FlowTrigger,
    FlowTriggerType,
    LocalesEnum,
    PieceTrigger,
    StepLocationRelativeToParent,
    UpdateActionRequest,
} from '@activepieces/shared'
import { Tool, tool } from 'ai'
import { z } from 'zod'
import { flowService } from '../flows/flow/flow.service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { system } from '../helper/system/system'
import { pieceMetadataService } from '../pieces/piece-metadata-service'

const log = system.globalLogger()

type CommonOperationParams = {
    userId: string
    projectId: string
    platformId: string
    flowId: string
    flowVersionId: string
}

type SaveFlowVersionParams = CommonOperationParams & {
    operation: FlowOperationRequest
}

const applyAndSaveFlowVersion = async (params: SaveFlowVersionParams): Promise<void> => {
    const { userId, projectId, platformId, flowId, operation } = params
    await flowService(log).update({
        id: flowId,
        userId,
        platformId,
        projectId,
        operation,
    })
}

type GetAllBuilderPieceParams = {
    searchQuery?: string
}

const getAllPiecesSummary =  async (params: GetAllBuilderPieceParams): Promise<PieceMetadataModelSummary[]> => {
    const latestRelease = await apVersionUtil.getCurrentRelease()
    const pieces = await pieceMetadataService(log).list({
        includeTags: false,
        includeHidden: false,
        searchQuery: params.searchQuery,
        release: latestRelease,
        edition: ApEdition.COMMUNITY,
        locale: LocalesEnum.ENGLISH,
    })
    // Take first 5 matches and remove i18n translations
    return pieces.map((piece) => ({ ...piece, i18n: undefined })).slice(0, 5)
}

type GetBuilderPieceParams = {
    platformId: string
    projectId: string
    name: string
    version: string | undefined
}

const getPieceMetadataByName = async (params: GetBuilderPieceParams): Promise<PieceMetadataModel> => {
    const piece = await pieceMetadataService(log).getOrThrow({
        ...params,
        locale: LocalesEnum.ENGLISH,
    })
    return { ...piece, i18n: undefined }
}

type UpdateTriggerParams = CommonOperationParams & {
    request: FlowTrigger
}

const updateTrigger = async (params: UpdateTriggerParams): Promise<void> => {
    const flowVersion = await flowVersionService(log).getOne(params.flowVersionId)
    assertNotNullOrUndefined(flowVersion, 'flow version not found')

    const operation: FlowOperationRequest = {
        type: FlowOperationType.UPDATE_TRIGGER,
        request: params.request,
    }

    await applyAndSaveFlowVersion({
        userId: params.userId,
        projectId: params.projectId,
        platformId: params.platformId,
        flowId: params.flowId,
        flowVersionId: params.flowVersionId,
        operation,
    })
}

type AddActionParams = CommonOperationParams & {
    request: AddActionRequest
}

const addAction = async (params: AddActionParams): Promise<void> => {
    const flowVersion = await flowVersionService(log).getOne(params.flowVersionId)
    assertNotNullOrUndefined(flowVersion, 'flow version not found')

    const operation: FlowOperationRequest = {
        type: FlowOperationType.ADD_ACTION,
        request: params.request,
    }

    await applyAndSaveFlowVersion({
        userId: params.userId,
        projectId: params.projectId,
        platformId: params.platformId,
        flowId: params.flowId,
        flowVersionId: params.flowVersionId,
        operation,
    })
}

type UpdateActionParams = CommonOperationParams & {
    request: UpdateActionRequest
}

const updateAction = async (params: UpdateActionParams): Promise<void> => {
    const flowVersion = await flowVersionService(log).getOne(params.flowVersionId)
    assertNotNullOrUndefined(flowVersion, 'flow version not found')

    const operation: FlowOperationRequest = {
        type: FlowOperationType.UPDATE_ACTION,
        request: params.request,
    }

    await applyAndSaveFlowVersion({
        userId: params.userId,
        projectId: params.projectId,
        platformId: params.platformId,
        flowId: params.flowId,
        flowVersionId: params.flowVersionId,
        operation,
    })
}

type RemoveActionParams = CommonOperationParams & {
    request: DeleteActionRequest
}

const removeAction = async (params: RemoveActionParams): Promise<void> => {
    const flowVersion = await flowVersionService(log).getOne(params.flowVersionId)
    assertNotNullOrUndefined(flowVersion, 'flow version not found')

    const operation: FlowOperationRequest = {
        type: FlowOperationType.DELETE_ACTION,
        request: params.request,
    }

    await applyAndSaveFlowVersion({
        userId: params.userId,
        projectId: params.projectId,
        platformId: params.platformId,
        flowId: params.flowId,
        flowVersionId: params.flowVersionId,
        operation,
    })
}

export const builderOperations = {
    updateTrigger,
    addAction,
    updateAction,
    removeAction,
}

export const buildBuilderTools = ({ userId, projectId, platformId, flowId, flowVersionId }: BuilderParams): Record<string, Tool> => {
    return {
        'list-pieces': tool({
            description: 'List all available pieces (and their names) with or without a search query',
            inputSchema: z.object({
                searchQuery: z.string().optional(),
            }),
            execute: async (params) => {
                log.info(params, 'list-pieces')
                return getAllPiecesSummary(params)
            },
        }),
        'get-piece-information': tool({
            description: 'Fetch information of a given piece including metadata, actions and triggers',
            inputSchema: z.object({
                pieceName: z.string(),
            }),
            execute: async ({ pieceName }) => {
                log.info({ pieceName }, 'get-piece-information params')
                if (!pieceName.startsWith('@')) {
                    throw new Error('Invalid piece name. Piece names must begin with "@"')
                }
                return getPieceMetadataByName({
                    projectId,
                    platformId,
                    name: pieceName,
                    version: undefined,
                })
            },
        }),
        'update-trigger': tool({
            description: 'update a flow trigger in workflow',
            inputSchema: z.object({
                pieceName: z.string(),
                pieceVersion: z.string(),
                pieceTriggerName: z.string(),
            }),
            execute: async ({ pieceName, pieceVersion, pieceTriggerName }) => {
                log.info({ flowVersionId, pieceName, pieceVersion, pieceTriggerName }, 'create-trigger params')
                if (!pieceName.startsWith('@')) {
                    throw new Error('Invalid piece name. Piece names must begin with "@"')
                }
                const request: PieceTrigger = {
                    name: 'trigger',
                    valid: true,
                    displayName: pieceTriggerName,
                    type: FlowTriggerType.PIECE,
                    settings: {
                        pieceName,
                        pieceVersion,
                        input: {},
                        propertySettings: {},
                        triggerName: pieceTriggerName.toLowerCase().replace(' ', '-'),
                    },
                }
                await builderOperations.updateTrigger({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    request,
                })
                log.info('updated version for create-trigger')
                return {
                    text: `updated flow with trigger ${pieceTriggerName}`,
                }
            },
        }),
        'add-action': tool({
            description: 'create a flow action in the workflow',
            inputSchema: z.object({
                parentStepName: z.string({ description: 'Name of the parent node' }),
                stepName: z.string({ description: 'Unique name of the step (step-1, step-2 etc' }),
                pieceName: z.string(),
                pieceVersion: z.string(),
                pieceActionName: z.string(),
            }),
            execute: async (params) => {
                log.info(params, 'add-action params')
                const { parentStepName, stepName, pieceName, pieceVersion, pieceActionName } = params
                if (!pieceName.startsWith('@')) {
                    throw new Error('Invalid piece name. Piece names must begin with "@"')
                }
                const request: AddActionRequest = {
                    parentStep: parentStepName,
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                    action: {
                        valid: true,
                        type: FlowActionType.PIECE,
                        name: stepName,
                        displayName: pieceActionName,
                        settings: {
                            pieceName,
                            pieceVersion,
                            actionName: pieceActionName,
                            input: {},
                            propertySettings: {},
                            errorHandlingOptions: {},
                        },
                    },
                }
                await builderOperations.addAction({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    request,
                })
                log.info('updated version for add-action')
                return {
                    text: `updated flow with action ${pieceActionName}`,
                }
            },
        }),
        'update-action': tool({
            description: 'update or replace a flow action in the workflow',
            inputSchema: z.object({
                pieceName: z.string(),
                pieceVersion: z.string(),
                pieceActionName: z.string(),
            }),
            execute: async (params) => {
                log.info(params, 'update-action params')
                const { pieceName, pieceVersion, pieceActionName } = params
                if (!pieceName.startsWith('@')) {
                    throw new Error('Invalid piece name. Piece names must begin with "@"')
                }
                const request: UpdateActionRequest = {
                    valid: true,
                    type: FlowActionType.PIECE,
                    name: pieceActionName,
                    displayName: pieceActionName,
                    settings: {
                        pieceName,
                        pieceVersion,
                        actionName: pieceActionName,
                        input: {},
                        propertySettings: {},
                        errorHandlingOptions: {},
                    },
                }
                await builderOperations.updateAction({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    request,
                })
                log.info('updated version for update-action')
                return {
                    text: `updated flow with action ${pieceActionName}`,
                }
            },
        }),
        'remove-action': tool({
            description: 'remove flow action from the workflow',
            inputSchema: z.object({
                actionNames: z.array(z.string()),
            }),
            execute: async ({ actionNames }) => {
                log.info({ flowVersionId, actionNames }, 'remove-action params')
                const request: DeleteActionRequest = {
                    names: actionNames,
                }
                await builderOperations.removeAction({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    request,
                })
                log.info('updated version for remove-action')
                return {
                    text: `updated flow, removed actions ${actionNames}`,
                }
            },
        }),
    }
}

type BuilderParams = {
    platformId: string
    projectId: string
    userId: string
    flowId: string
    flowVersionId: string
}
