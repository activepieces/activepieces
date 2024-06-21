
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import {
    getPiecePackage,
    pieceMetadataService,
} from '../pieces/piece-metadata-service'
import { encryptUtils } from './encryption'
import { logger, networkUtls } from '@activepieces/server-shared'
import {
    Action,
    ActionType,
    apId,
    assertNotNullOrUndefined,
    EngineOperationType,
    EngineTestOperation,
    ExecuteExtractPieceMetadata,
    ExecutePropsOptions,
    ExecuteStepOperation,
    ExecuteValidateAuthOperation,
    flowHelper,
    FlowVersion,
    PrincipalType,
    ProjectId,
} from '@activepieces/shared'
import { EngineHelperActionResult, EngineHelperExtractPieceInformation, EngineHelperFlowResult, EngineHelperPropResult, EngineHelperResponse, EngineHelperValidateAuthResult, engineRunner, Sandbox, SandBoxCacheType, sandboxProvisioner } from 'server-worker'

type GenerateEngineTokenParams = {
    projectId: ProjectId
    jobId?: string
}


export const generateEngineToken = ({
    jobId,
    projectId,
}: GenerateEngineTokenParams): Promise<string> => {
    return accessTokenManager.generateToken({
        id: jobId ?? apId(),
        type: PrincipalType.ENGINE,
        projectId,
        // TODO NOW remove this hack
        platform: {
            id: apId(),
        },
    })
}

export const engineHelper = {
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
            serverUrl: await networkUtls.getApiUrl(),
            engineToken: await generateEngineToken({
                projectId: operation.projectId,
            }),
        }

        return engineRunner.execute(EngineOperationType.EXECUTE_PROPERTY, sandbox, input)
    },
    async extractPieceMetadata(
        operation: ExecuteExtractPieceMetadata,
    ): Promise<EngineHelperResponse<EngineHelperExtractPieceInformation>> {
        logger.debug({ operation }, '[EngineHelper#extractPieceMetadata]')

        const sandbox = await sandboxProvisioner.provision({
            type: SandBoxCacheType.NONE,
            pieces: [operation],
        })

        return engineRunner.execute(
            EngineOperationType.EXTRACT_PIECE_METADATA,
            sandbox,
            operation,
        )
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
            serverUrl: await networkUtls.getApiUrl(),
            engineToken: await generateEngineToken({
                projectId: operation.projectId,
            }),
        }

        return engineRunner.execute(EngineOperationType.EXECUTE_STEP, sandbox, input)
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
            serverUrl: await networkUtls.getApiUrl(),
            engineToken: await generateEngineToken({
                projectId: operation.projectId,
            }),
        }

        return engineRunner.execute(EngineOperationType.EXECUTE_VALIDATE_AUTH, sandbox, input)
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

        return engineRunner.execute(EngineOperationType.EXECUTE_TEST_FLOW, sandbox, {
            ...operation,
            serverUrl: await networkUtls.getApiUrl(),
            engineToken: await generateEngineToken({
                projectId: operation.projectId,
            }),
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
                sourceCodeHash: encryptUtils.hashObject(action.settings.sourceCode),
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
type EngineConstants = 'serverUrl' | 'engineToken'
