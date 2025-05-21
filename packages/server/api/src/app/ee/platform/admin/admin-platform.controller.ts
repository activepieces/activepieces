import { AdminAddPlatformRequestBody, AdminRetryRunsRequestBody, ApEdition, assertNotNullOrUndefined, isNil, PieceActionSettings, PieceTriggerSettings, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../../helper/system/system'
import { adminPlatformService } from './admin-platform.service'
import { flowStructureUtil } from '@activepieces/shared'
import { Type } from '@fastify/type-provider-typebox'
import { flowService } from '../../../flows/flow/flow.service'
import { flowVersionRepo, flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { pieceMetadataService } from '../../../pieces/piece-metadata-service'
import { projectService } from '../../../project/project-service'

export const adminPlatformModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    const edition = system.getEdition()
    if (edition === ApEdition.CLOUD) {
        app.post('/', AdminAddPlatformRequest, async (req, res) => {
            const newPlatform = await adminPlatformService(req.log).add(req.body)
            return res.status(StatusCodes.CREATED).send(newPlatform)
        })
    }
    app.post('/runs/retry', AdminRetryRunsRequest, async (req, res) => {
        await adminPlatformService(req.log).retryRuns(req.body)
        return res.status(StatusCodes.OK).send()
    })

    app.post('/fix', FixFlowRequest, async (req, res) => {
        const { flowId, flowVersionId } = req.body
        const flow = await flowService(req.log).getOneById(flowId);
        assertNotNullOrUndefined(flow, 'Flow not found')
        const flowVersions = await flowVersionService(req.log).list({
            flowId,
            limit: 10000,
            cursorRequest: null
        })
        let updated = 0;
        for (const flowVersion of flowVersions.data) {
            if (flowVersionId && flowVersion.id !== flowVersionId) {
                continue;
            }
            const trigger = flowVersion.trigger
            const isAllStepVersionOne = await flowStructureUtil.getAllSteps(trigger).filter(step => step.type === 'PIECE' || step.type === 'PIECE_TRIGGER').every(step => (step.settings as (PieceTriggerSettings | PieceActionSettings)).pieceVersion === '1.0.0')
            if (!isAllStepVersionOne) {
                const piecesAndLatestVersions = await Promise.all(
                    flowStructureUtil.getAllSteps(trigger)
                        .filter(step => step.type === 'PIECE' || step.type === 'PIECE_TRIGGER')
                        .map(async (step) => {
                            const platformId = await projectService.getPlatformId(flow?.projectId)
                            const piece = await pieceMetadataService(req.log).getOrThrow({
                                name: (step.settings as (PieceTriggerSettings | PieceActionSettings)).pieceName,
                                version: undefined,
                                platformId: platformId,
                                projectId: flow.projectId,
                            })
                            return {
                                piece,
                                stepName: step.name,
                                pieceVersion: piece.version
                            }
                        })
                ).then(results => results.reduce((acc, curr) => {
                    acc[curr.stepName] = curr.pieceVersion
                    return acc
                }, {} as Record<string, string>))
                const newTrigger = flowStructureUtil.transferStep(trigger, (step) => {
                    if (step.type === 'PIECE' || step.type === 'PIECE_TRIGGER' && !isNil(piecesAndLatestVersions[step.name])) {
                        return {
                            ...step,
                            settings: {
                                ...step.settings,
                                pieceVersion: piecesAndLatestVersions[step.name]
                            }
                        }
                    }
                    return step
                })
                updated++;
                await flowVersionRepo().update({
                    id: flowVersion.id,
                }, {
                    trigger: newTrigger as any,
                })
            }
        }
        return res.status(StatusCodes.OK).send({
            updated,
        })
    })
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const AdminRetryRunsRequest = {
    schema: {
        body: AdminRetryRunsRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const FixFlowRequest = {
    schema: {
        body: Type.Object({
            flowId: Type.String(),
            flowVersionId: Type.Optional(Type.String()),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}
