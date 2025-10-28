import { ActionBase, PieceMetadataModel, PieceMetadataModelSummary, TriggerBase } from '@activepieces/pieces-framework'
import { apVersionUtil } from '@activepieces/server-shared'
import {
    AddActionRequest,
    AddBranchRequest,
    ApEdition,
    BranchExecutionType,
    DeleteActionRequest,
    DeleteBranchRequest,
    FlowActionType,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    FlowTriggerType,
    isNil,
    LocalesEnum,
    MoveActionRequest,
    PieceTrigger,
    RouterExecutionType,
    StepLocationRelativeToParent,
} from '@activepieces/shared'
import { Tool, tool } from 'ai'
import { z } from 'zod'
import { flowService } from '../flows/flow/flow.service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { system } from '../helper/system/system'
import { pieceMetadataService } from '../pieces/piece-metadata-service'
import {
    findBranchIndexFromNameInRouter,
    getDefaultPropertySettingsForActionOrTrigger,
    getInitalStepInputForActionOrTrigger,
    validatePieceNameOrThrow,
} from './builder.utils'
import { BuilderToolName } from './constants'

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

const findPieces =  async (params: GetAllBuilderPieceParams): Promise<PieceMetadataModelSummary[]> => {
    const latestRelease = await apVersionUtil.getCurrentRelease()
    const pieces = await pieceMetadataService(log).list({
        includeTags: false,
        includeHidden: false,
        searchQuery: params.searchQuery,
        release: latestRelease,
        edition: ApEdition.COMMUNITY,
        locale: LocalesEnum.ENGLISH,
    })
    // Take first 5 matches
    return pieces.slice(0, 5)
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
    return piece
}

type BuilderParams = {
    platformId: string
    projectId: string
    userId: string
    flowId: string
    flowVersionId: string
}

enum ToolExecutionStatus {
    SUCCESS = 'success',
    FAILURE = 'failure',
}

export const buildBuilderTools = ({ userId, projectId, platformId, flowId, flowVersionId }: BuilderParams): Record<string, Tool> => {
    return {
        [BuilderToolName.LIST_PIECES]: tool({
            description: 'List all available pieces (and their names) with or without a search query',
            inputSchema: z.object({
                searchQuery: z.string().optional(),
            }),
            execute: async (params) => {
                log.info(params, 'list-pieces params')
                const pieces = await findPieces(params)
                const minimalPieces = pieces.map((piece) => ({
                    name: piece.name,
                    version: piece.version,
                    displayName: piece.displayName,
                    description: piece.description,
                })).slice(0, 5)
                return { pieces: minimalPieces }
            },
        }),
        [BuilderToolName.GET_PIECE_INFO]: tool({
            description: 'Fetch information of a given piece including metadata, actions and triggers',
            inputSchema: z.object({
                pieceName: z.string(),
            }),
            execute: async ({ pieceName }) => {
                log.info({ pieceName }, 'get-piece-information params')
                validatePieceNameOrThrow(pieceName)
                const piece = await getPieceMetadataByName({
                    projectId,
                    platformId,
                    name: pieceName,
                    version: undefined,
                })
                // Remove unwanted information
                const actions = Object.fromEntries(Object.entries(piece.actions).map(([name, value]) => {
                    const cleanedValue: Partial<ActionBase> = {
                        name: value.name,
                        displayName: value.displayName,
                        description: value.description,
                    }
                    return [name, cleanedValue]
                }))
                const triggers = Object.fromEntries(Object.entries(piece.triggers).map(([name, value]) => {
                    const cleanedValue: Partial<TriggerBase> = {
                        name: value.name,
                        displayName: value.displayName,
                        description: value.description,
                    }
                    return [name, cleanedValue]
                }))
                const minimalMetadata =  {
                    name: piece.name,
                    version: piece.version,
                    displayName: piece.displayName,
                    description: piece.description,
                    actions,
                    triggers,
                }
                return { pieceMetadata: minimalMetadata }
            },
        }),
        [BuilderToolName.UPDATE_TRIGGER]: tool({
            description: 'Update a trigger step in workflow',
            inputSchema: z.object({
                pieceName: z.string(),
                pieceVersion: z.string(),
                pieceTriggerName: z.string(),
            }),
            execute: async ({ pieceName, pieceVersion, pieceTriggerName }) => {
                log.info({ pieceName, pieceVersion, pieceTriggerName }, 'update-trigger params')
                validatePieceNameOrThrow(pieceName)

                const pieceMetadata = await getPieceMetadataByName({ name: pieceName, version: pieceVersion, platformId, projectId })
                const pieceTrigger = pieceMetadata.triggers[pieceTriggerName]

                const input = getInitalStepInputForActionOrTrigger(pieceTrigger)
                const propertySettings = getDefaultPropertySettingsForActionOrTrigger(pieceTrigger)

                log.debug(input, 'piece trigger input')
                log.debug(propertySettings, 'piece trigger propertySettings')

                const request: PieceTrigger = {
                    name: 'trigger',
                    valid: true,
                    displayName: pieceTrigger.displayName,
                    type: FlowTriggerType.PIECE,
                    settings: {
                        pieceName,
                        pieceVersion,
                        input,
                        propertySettings,
                        triggerName: pieceTriggerName,
                    },
                }

                const operation: FlowOperationRequest = {
                    type: FlowOperationType.UPDATE_TRIGGER,
                    request,
                }

                await applyAndSaveFlowVersion({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    operation,
                })

                log.info('updated version for create-trigger')

                return {
                    text: `Updated flow with trigger ${pieceTriggerName}`,
                }
            },
        }),
        [BuilderToolName.ADD_ACTION]: tool({
            description: 'Create a flow action in the workflow',
            inputSchema: z.object({
                parentStepName: z.string({ description: 'Name of the parent step under which action is to be added' }),
                stepName: z.string({ description: 'Unique name of the step (step_1, step_2 etc)' }),
                branchName: z.optional(z.string({ description: 'Branch in which the step needs to be added (when parentStepName is a router name)' })),
                pieceName: z.string(),
                pieceVersion: z.string(),
                pieceActionName: z.string(),
            }),
            execute: async (params) => {
                log.info(params, 'add-action params')
                const { parentStepName, stepName, branchName, pieceName, pieceVersion, pieceActionName } = params
                validatePieceNameOrThrow(pieceName)

                const metadata = await pieceMetadataService(log).getOrThrow({ name: pieceName, version: pieceVersion, platformId, projectId })
                const pieceAction = metadata?.actions[pieceActionName]

                const input = getInitalStepInputForActionOrTrigger(pieceAction)
                const propertySettings = getDefaultPropertySettingsForActionOrTrigger(pieceAction)
                log.debug(input, 'piece action input')
                log.debug(propertySettings, 'piece action propertySettings')

                const flowVersion = await flowVersionService(log).getOne(flowVersionId)
                if (isNil(flowVersion)) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: 'Unable to find flow with specified version',
                    }
                }

                const parentStep = flowStructureUtil.getStep(parentStepName, flowVersion.trigger)
                if (isNil(parentStep)) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: `Unable to find parent step ${parentStepName}`,
                    }
                }

                const isParentARouter = parentStep.type === FlowActionType.ROUTER
                const branchIndex = isParentARouter && branchName ? parentStep.settings.branches.findIndex(branch => branch.branchName === branchName) : undefined

                log.debug({ isParentARouter, branchIndex }, 'add-action extra params')

                const request: AddActionRequest = {
                    parentStep: parentStepName,
                    stepLocationRelativeToParent: isParentARouter ? StepLocationRelativeToParent.INSIDE_BRANCH : StepLocationRelativeToParent.AFTER,
                    action: {
                        valid: true,
                        type: FlowActionType.PIECE,
                        name: stepName,
                        displayName: pieceAction.displayName,
                        settings: {
                            pieceName,
                            pieceVersion,
                            actionName: pieceActionName,
                            input,
                            propertySettings,
                            errorHandlingOptions: {},
                        },
                    },
                    branchIndex,
                }
                const operation: FlowOperationRequest = {
                    type: FlowOperationType.ADD_ACTION,
                    request,
                }

                await applyAndSaveFlowVersion({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    operation,
                })

                return { text: `Added a step ${stepName} with action ${pieceActionName}` }
            },
        }),
        [BuilderToolName.MOVE_ACTION]: tool({
            description: 'Move an action step under some other step or to a specific branch of a router step',
            inputSchema: z.object({
                parentStepName: z.string({ description: 'name of the parent step under which this step will be placed' }),
                stepName: z.string({ description: 'step name of the action to be moved (eg. step_1, step_2 etc.)' }),
                routerName: z.optional(z.string({ description: 'Name of the router step (if step needs to be moved inside router)' })),
                routerBranchName: z.optional(z.string({ description: 'Branch name of the router (if router is specified)' })),
            }),
            execute: async (params) => {
                log.info(params, 'move-action params')

                const { parentStepName, stepName, routerName, routerBranchName } = params
                const flowVersion = await flowVersionService(log).getOne(flowVersionId)
                if (isNil(flowVersion)) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: 'Unable to find flow with specified version',
                    }
                }

                const parentStep = flowStructureUtil.getStep(parentStepName, flowVersion.trigger)
                let routerStepName = undefined
                let routerBranchIndex = undefined
                if (isNil(parentStep)) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: `Unable to find parent step ${parentStepName}`,
                    }
                }

                if (routerName) {
                    const routerStep = flowStructureUtil.getStep(routerName, flowVersion.trigger)
                    if (routerStep && routerStep.type === FlowActionType.ROUTER) {
                        routerStepName = parentStepName
                    }
                    else {
                        return {
                            status: ToolExecutionStatus.FAILURE,
                            text: `Specified router ${routerName} is not of type router`,
                        }
                    }

                    if (routerBranchName) {
                        routerBranchIndex = findBranchIndexFromNameInRouter(parentStep, routerBranchName)
                    }
                }

                const request: MoveActionRequest = {
                    name: stepName,
                    newParentStep: parentStepName,
                    stepLocationRelativeToNewParent: routerStepName ? StepLocationRelativeToParent.INSIDE_BRANCH : StepLocationRelativeToParent.AFTER,
                    branchIndex: routerBranchIndex,
                }
                const operation: FlowOperationRequest = {
                    type: FlowOperationType.MOVE_ACTION,
                    request,
                }

                await applyAndSaveFlowVersion({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    operation,
                })
                return {
                    text: `Moved action ${stepName} under ${parentStepName}`,
                }
            },
        }),
        [BuilderToolName.REMOVE_ACTION]: tool({
            description: 'Remove flow action from the workflow',
            inputSchema: z.object({
                actionNames: z.array(z.string()),
            }),
            execute: async ({ actionNames }) => {
                log.info({ actionNames }, 'remove-action params')
                const request: DeleteActionRequest = {
                    names: actionNames,
                }
                const operation: FlowOperationRequest = {
                    type: FlowOperationType.DELETE_ACTION,
                    request,
                }

                await applyAndSaveFlowVersion({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    operation,
                })

                log.info('updated version for remove-action')
                return {
                    text: `Updated flow, removed actions ${actionNames}`,
                }
            },
        }),
        [BuilderToolName.ADD_ROUTER]: tool({
            description: 'Add a router step in the flow. Router consists of branches which are triggered based on some condition',
            inputSchema: z.object({
                parentStepName: z.string({ description: 'Name of the parent step' }),
                stepName: z.string({ description: 'Unique name of the step (step_1, step_2 etc' }),
            }),
            execute: async ({ parentStepName, stepName }) => {
                log.info({ parentStepName, stepName }, 'add-router params')
                const request: AddActionRequest = {
                    parentStep: parentStepName,
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                    action: {
                        valid: true,
                        name: stepName,
                        displayName: 'Router',
                        type: FlowActionType.ROUTER,
                        settings: {
                            branches: [
                                { branchName: 'Branch 1', branchType: BranchExecutionType.CONDITION, conditions: [] },
                                { branchName: 'Otherwise', branchType: BranchExecutionType.FALLBACK },
                            ],
                            executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                        },
                    },
                }

                const operation: FlowOperationRequest = {
                    type: FlowOperationType.ADD_ACTION,
                    request,
                }

                await applyAndSaveFlowVersion({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    operation,
                })

                log.info('updated version for add-router-action')
                return {
                    text: `Added a router ${stepName} with two branches "Branch 1" and "Otherwise"`,
                }
            },
        }),
        [BuilderToolName.ADD_BRANCH]: tool({
            description: 'Add a new branch to a router step',
            inputSchema: z.object({
                parentStepName: z.string({ description: 'Name of the parent router step' }),
            }),
            execute: async ({ parentStepName }) => {
                log.info({ parentStepName }, 'add-branch params')

                const flowVersion = await flowVersionService(log).getOne(flowVersionId)
                if (isNil(flowVersion)) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: 'Unable to find flow with specified version',
                    }
                }

                const parentStep = flowStructureUtil.getStep(parentStepName, flowVersion.trigger)

                if (isNil(parentStep)) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: `Unable to find parent step ${parentStepName}`,
                    }
                }

                if (parentStep.type !== FlowActionType.ROUTER) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: `Cannot add branch because ${parentStepName} step is not a router`,
                    }
                }

                const newBranchIndex = parentStep.settings.branches.length
                const newBranchName = `Branch ${newBranchIndex}`

                const request: AddBranchRequest = {
                    stepName: parentStepName,
                    branchName: newBranchName,
                    branchIndex: newBranchIndex,
                    conditions: [],
                }

                const operation: FlowOperationRequest = {
                    type: FlowOperationType.ADD_BRANCH,
                    request,
                }

                await applyAndSaveFlowVersion({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    operation,
                })

                return {
                    status: ToolExecutionStatus.SUCCESS,
                    text: `Add a new branch ${newBranchName} in router ${parentStepName}`,
                }
            },
        }),
        [BuilderToolName.REMOVE_BRANCH]: tool({
            description: 'Remove a branch from a router step',
            inputSchema: z.object({
                parentStepName: z.string({ description: 'Name of the parent router step' }),
                branchName: z.string({ description: 'Branch name to remove' }),
            }),
            execute: async ({ parentStepName, branchName }) => {
                log.info({ parentStepName, branchName }, 'remove-branch params')

                const flowVersion = await flowVersionService(log).getOne(flowVersionId)
                if (isNil(flowVersion)) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: 'Unable to find flow with specified version',
                    }
                }

                const parentStep = flowStructureUtil.getStep(parentStepName, flowVersion.trigger)

                if (isNil(parentStep)) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: `Unable to find parent step ${parentStepName}`,
                    }
                }

                if (parentStep.type !== FlowActionType.ROUTER) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: `Cannot remove branch because ${parentStepName} step is not a router`,
                    }
                }

                const branchIndex = parentStep.settings.branches.findIndex(branch => branch.branchName === branchName)

                if (branchIndex < 0) {
                    return {
                        status: ToolExecutionStatus.FAILURE,
                        text: `Unable find branch ${branchName} in ${parentStepName} router`,
                    }
                }

                const request: DeleteBranchRequest = {
                    stepName: parentStepName,
                    branchIndex,
                }

                const operation: FlowOperationRequest = {
                    type: FlowOperationType.DELETE_BRANCH,
                    request,
                }

                await applyAndSaveFlowVersion({
                    userId,
                    projectId,
                    platformId,
                    flowId,
                    flowVersionId,
                    operation,
                })

                return {
                    status: ToolExecutionStatus.SUCCESS,
                    text: `Removed branch ${branchName} from router ${parentStepName}`,
                }
            },
        }),
    }
}
