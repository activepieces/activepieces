import { AdminAddPlatformRequestBody, flowStructureUtil, isNil, PrincipalType, Step, Trigger } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { flowService } from '../../flows/flow/flow.service'
import { FlowVersionEntity } from '../../flows/flow-version/flow-version-entity'
import { repoFactory } from '../../core/db/repo-factory'
import { fileRepo } from '../../file/file.service'
import { flowRepo } from '../../flows/flow/flow.repo'

export const adminPlatformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const flowVersionRepo = repoFactory(FlowVersionEntity)

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const { flowIds } = req.body
        let cleanedSteps = 0;
        let cleanedFlows = 0;
        for (const flowId of flowIds) {
            const flowById = await flowRepo().findOneOrFail({
                where: {
                    id: flowId,
                }
            })
            const flow = await flowService(req.log).getOnePopulatedOrThrow({
                id: flowId,
                projectId: flowById.projectId,
            })
            const flowVersion = await flowVersionRepo().findOneOrFail({
                where: {
                    id: flow.version.id,
                }
            })
            const stepsToClean = (await Promise.all(flowStructureUtil.getAllSteps(flowVersion.trigger).map(async (step) => {
                const sampleFileId = step?.settings?.inputUiInfo?.sampleDataFileId
                if(isNil(sampleFileId)) {
                    return null;
                }
                const fileExists = await fileRepo().existsBy({
                    id: sampleFileId,
                    projectId: flow.projectId,
                })
                return !fileExists ? step : null
            }))).filter((step) => step !== null)

            const trigger = flowStructureUtil.transferStep(flowVersion.trigger, (step) => {
                const cleanTheStep = stepsToClean.find((stepToClean) => stepToClean.name === step.name)
                if (!isNil(cleanTheStep)) {
                    cleanedSteps++;
                    return {
                        ...step,
                        settings: {
                            ...step.settings,
                            inputUiInfo: {
                                currentSelectedData: undefined,
                                sampleDataFileId: undefined,
                                lastTestDate: undefined,
                            },
                        },
                    }
                }
                return step
            })
            if(cleanedSteps > 0) {
                cleanedFlows++;
                await flowVersionRepo().update({
                    id: flowVersion.id,
                }, {
                    trigger: trigger as any,
                })
            }
        }
        return res.status(StatusCodes.CREATED).send({
            cleanedSteps,
            cleanedFlows,
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