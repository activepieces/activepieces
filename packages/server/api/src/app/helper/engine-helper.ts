import { appEventRoutingService } from '../app-event-routing/app-event-routing.service'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import {
    getPiecePackage,
    pieceMetadataService,
} from '../pieces/piece-metadata-service'
import { hashObject } from './encryption'
import { getEdition, getWebhookSecret } from './secret-helper'
import {
    DropdownState,
    DynamicPropsValue,
    PieceMetadata,
} from '@activepieces/pieces-framework'
import { engine, getServerUrl, logger, Sandbox, SandBoxCacheType, sandboxProvisioner } from '@activepieces/server-shared'
import {
    Action,
    ActionType,
    apId,
    assertNotNullOrUndefined,
    EngineOperationType,
    EngineResponseStatus,
    EngineTestOperation,
    ExecuteActionResponse,
    ExecuteExtractPieceMetadata,
    ExecutePropsOptions,
    ExecuteStepOperation,
    ExecuteTriggerOperation,
    ExecuteTriggerResponse,
    ExecuteValidateAuthOperation,
    ExecuteValidateAuthResponse,
    flowHelper,
    FlowRunResponse,
    FlowVersion,
    PieceTrigger,
    PlatformRole,
    PrincipalType,
    ProjectId,
    TriggerHookType,
} from '@activepieces/shared'

type GenerateWorkerTokenParams = {
    projectId: ProjectId
}

export type EngineHelperFlowResult = FlowRunResponse

export type EngineHelperTriggerResult<
    T extends TriggerHookType = TriggerHookType,
> = ExecuteTriggerResponse<T>

export type EngineHelperPropResult =
  | DropdownState<unknown>
  | Record<string, DynamicPropsValue>

export type EngineHelperActionResult = ExecuteActionResponse

export type EngineHelperValidateAuthResult = ExecuteValidateAuthResponse

export type EngineHelperCodeResult = ExecuteActionResponse
export type EngineHelperExtractPieceInformation = PieceMetadata

export type EngineHelperResult =
  | EngineHelperFlowResult
  | EngineHelperTriggerResult
  | EngineHelperPropResult
  | EngineHelperCodeResult
  | EngineHelperExtractPieceInformation
  | EngineHelperActionResult
  | EngineHelperValidateAuthResult

export type EngineHelperResponse<Result extends EngineHelperResult> = {
    status: EngineResponseStatus
    result: Result
    standardError: string
    standardOutput: string
}

const generateWorkerToken = ({
    projectId,
}: GenerateWorkerTokenParams): Promise<string> => {
    return accessTokenManager.generateToken({
        id: apId(),
        type: PrincipalType.WORKER,
        projectId,
        // TODO NOW remove this hack
        platform: {
            id: apId(),
            role: PlatformRole.OWNER,
        },
    })
}

export const engineHelper = {
    async executeTrigger<T extends TriggerHookType>(
        operation: Omit<ExecuteTriggerOperation<T>, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperTriggerResult<T>>> {
        logger.debug(
            { hookType: operation.hookType, projectId: operation.projectId },
            '[EngineHelper#executeTrigger]',
        )

        const lockedFlowVersion = await flowVersionService.lockPieceVersions({
            projectId: operation.projectId,
            flowVersion: operation.flowVersion,
        })

        const triggerSettings = (lockedFlowVersion.trigger as PieceTrigger)
            .settings
        const { packageType, pieceType, pieceName, pieceVersion } = triggerSettings

        const exactPieceVersion = await pieceMetadataService.getExactPieceVersion({
            name: pieceName,
            version: pieceVersion,
            projectId: operation.projectId,
        })

        const sandbox = await sandboxProvisioner.provision({
            type: SandBoxCacheType.PIECE,
            pieceName,
            pieceVersion: exactPieceVersion,
            pieces: [
                await getPiecePackage(operation.projectId, {
                    packageType,
                    pieceType,
                    pieceName,
                    pieceVersion: exactPieceVersion,
                }),
            ],
        })

        const input = {
            ...operation,
            pieceVersion: exactPieceVersion,
            flowVersion: lockedFlowVersion,
            edition: getEdition(),
            appWebhookUrl: await appEventRoutingService.getAppWebhookUrl({
                appName: pieceName,
            }),
            serverUrl: await getServerUrl(),
            webhookSecret: await getWebhookSecret(operation.flowVersion),
            workerToken: await generateWorkerToken({
                projectId: operation.projectId,
            }),
        }

        return engine.execute({
            operation: EngineOperationType.EXECUTE_TRIGGER_HOOK,
            sandbox,
            input,
        })
    },

    async executeProp(
        operation: Omit<ExecutePropsOptions, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperPropResult>> {
        logger.debug(
            {
                piece: operation.piece,
                projectId: operation.projectId,
                stepName: operation.stepName,
            },
            '[EngineHelper#executeProp]',
        )

        const { piece } = operation

        piece.pieceVersion = await pieceMetadataService.getExactPieceVersion({
            name: piece.pieceName,
            version: piece.pieceVersion,
            projectId: operation.projectId,
        })

        const sandbox = await sandboxProvisioner.provision({
            type: SandBoxCacheType.PIECE,
            pieceName: piece.pieceName,
            pieceVersion: piece.pieceVersion,
            pieces: [piece],
        })

        const input = {
            ...operation,
            serverUrl: await getServerUrl(),
            workerToken: await generateWorkerToken({
                projectId: operation.projectId,
            }),
        }

        return engine.execute({
            operation: EngineOperationType.EXECUTE_PROPERTY,
            sandbox,
            input,
        })
    },

    async extractPieceMetadata(input: ExecuteExtractPieceMetadata): Promise<EngineHelperResponse<EngineHelperExtractPieceInformation>> {
        logger.debug({ input }, '[EngineHelper#extractPieceMetadata]')

        const { pieceName, pieceVersion } = input
        const piece = input

        const sandbox = await sandboxProvisioner.provision({
            type: SandBoxCacheType.PIECE,
            pieceName,
            pieceVersion,
            pieces: [piece],
        })

        return engine.execute({
            operation: EngineOperationType.EXTRACT_PIECE_METADATA,
            sandbox,
            input,
        })
    },

    async executeAction(
        operation: Omit<ExecuteStepOperation, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperActionResult>> {
        logger.debug(
            {
                flowVersionId: operation.flowVersion.id,
                stepName: operation.stepName,
            },
            '[EngineHelper#executeAction]',
        )
        const lockedFlowVersion = await lockPieceAction(operation)
        const step = flowHelper.getStep(lockedFlowVersion, operation.stepName) as
      | Action
      | undefined
        assertNotNullOrUndefined(step, 'Step not found')
        const sandbox = await getSandboxForAction(
            operation.projectId,
            operation.flowVersion.flowId,
            step,
        )
        const input: ExecuteStepOperation = {
            flowVersion: lockedFlowVersion,
            stepName: operation.stepName,
            projectId: operation.projectId,
            serverUrl: await getServerUrl(),
            workerToken: await generateWorkerToken({
                projectId: operation.projectId,
            }),
        }

        return engine.execute({
            operation: EngineOperationType.EXECUTE_STEP,
            sandbox,
            input,
        })
    },

    async executeValidateAuth(
        operation: Omit<ExecuteValidateAuthOperation, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperValidateAuthResult>> {
        logger.debug(
            { piece: operation.piece },
            '[EngineHelper#executeValidateAuth]',
        )

        const { piece } = operation

        piece.pieceVersion = await pieceMetadataService.getExactPieceVersion({
            name: piece.pieceName,
            version: piece.pieceVersion,
            projectId: operation.projectId,
        })

        const sandbox = await sandboxProvisioner.provision({
            type: SandBoxCacheType.PIECE,
            pieceName: piece.pieceName,
            pieceVersion: piece.pieceVersion,
            pieces: [piece],
        })

        const input = {
            ...operation,
            serverUrl: await getServerUrl(),
            workerToken: await generateWorkerToken({
                projectId: operation.projectId,
            }),
        }

        return engine.execute({
            operation: EngineOperationType.EXECUTE_VALIDATE_AUTH,
            sandbox,
            input,
        })
    },

    async executeTest(
        sandbox: Sandbox,
        operation: Omit<EngineTestOperation, EngineConstants>,
    ): Promise<EngineHelperResponse<EngineHelperFlowResult>> {
        logger.debug(
            {
                flowVersionId: operation.sourceFlowVersion.id,
                projectId: operation.projectId,
                sandboxId: sandbox.boxId,
                executionType: operation.executionType,
            },
            '[EngineHelper#executeTest]',
        )

        const input = {
            ...operation,
            serverUrl: await getServerUrl(),
            workerToken: await generateWorkerToken({
                projectId: operation.projectId,
            }),
        }

        return engine.execute({
            operation: EngineOperationType.EXECUTE_TEST_FLOW,
            sandbox,
            input,
        })
    },
}

async function lockPieceAction({
    projectId,
    flowVersion,
    stepName,
}: {
    projectId: string
    flowVersion: FlowVersion
    stepName: string
}): Promise<FlowVersion> {
    return flowHelper.transferFlowAsync(flowVersion, async (step) => {
        if (step.name === stepName && step.type === ActionType.PIECE) {
            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: await pieceMetadataService.getExactPieceVersion({
                        name: step.settings.pieceName,
                        version: step.settings.pieceVersion,
                        projectId,
                    }),
                },
            }
        }
        return step
    })
}

async function getSandboxForAction(
    projectId: string,
    flowId: string,
    action: Action,
): Promise<Sandbox> {
    switch (action.type) {
        case ActionType.PIECE: {
            const { packageType, pieceType, pieceName, pieceVersion } =
        action.settings
            const piece = {
                packageType,
                pieceType,
                pieceName,
                pieceVersion,
                projectId,
            }

            return sandboxProvisioner.provision({
                type: SandBoxCacheType.PIECE,
                pieceName: piece.pieceName,
                pieceVersion: piece.pieceVersion,
                pieces: [await getPiecePackage(projectId, piece)],
            })
        }
        case ActionType.CODE: {
            return sandboxProvisioner.provision({
                type: SandBoxCacheType.CODE,
                flowId,
                name: action.name,
                sourceCodeHash: hashObject(action.settings.sourceCode),
                codeSteps: [
                    {
                        name: action.name,
                        sourceCode: action.settings.sourceCode,
                    },
                ],
            })
        }
        case ActionType.BRANCH:
        case ActionType.LOOP_ON_ITEMS:
            return sandboxProvisioner.provision({
                type: SandBoxCacheType.NONE,
            })
    }
}
type EngineConstants = 'serverUrl' | 'workerToken'
