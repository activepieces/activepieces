import { AdminAddPlatformRequestBody, PrincipalType, Step, RouterExecutionType, BranchExecutionType, RouterActionSettings, ALL_PRINCIPAL_TYPES, RouterAction, ActionType, flowStructureUtil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { adminPlatformService } from './admin-platform.service'
import { repoFactory } from '../../core/db/repo-factory'
import { FlowVersionEntity } from '../../flows/flow-version/flow-version-entity'
import { In, IsNull } from 'typeorm'

export const adminPlatformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const flowVersionRepo = repoFactory(FlowVersionEntity)

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await adminPlatformService.add(req.body)
        return res.status(StatusCodes.CREATED).send(newPlatform)
    })

    app.post('/migrate', MigrateBranchToRouterRequest, async (req, res) => {

        const flowVersions = await flowVersionRepo().find({
            where: {
                schemaVersion: IsNull(),
                ...(req.body.flowIds ? { flowId: In(req.body.flowIds) } : {}),
            },
            take: req.body.limit,
        })

        for (const flowVersion of flowVersions) {
            const originalSize = flowStructureUtil.getAllSteps(flowVersion.trigger).length
            const updated = await traverseAndUpdateSubFlow((step: any) => {
                if (step.type === 'BRANCH') {
                    step.type = 'ROUTER'
                    step.settings = {
                        branches: [
                            {
                                conditions: step.settings.conditions,
                                branchType: BranchExecutionType.CONDITION,
                                branchName: 'On Success',
                            },
                            {
                                branchType: BranchExecutionType.FALLBACK,
                                branchName: 'Otherwise',
                            }
                        ],
                        executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                        inputUiInfo: {
                            sampleDataFileId: undefined,
                            lastTestDate: undefined,
                            customizedInputs: undefined,
                            currentSelectedData: undefined,
                        },
                    }
                    step.children = [step.onSuccessAction, step.onFailureAction]
                    step.onSuccessAction = undefined
                    step.onFailureAction = undefined
                }
            }, flowVersion.trigger)

            if (updated) {
                const updatedStepsSize = flowStructureUtil.getAllSteps(flowVersion.trigger).length
                if (originalSize !== updatedStepsSize) {
                    throw new Error(`steps size mismatch for flow: ${flowVersion.displayName}`)
                }
                await flowVersionRepo().save({
                    ...flowVersion,
                    schemaVersion: '1',
                })
            }

        }

        return res.status(StatusCodes.OK).send(flowVersions.length)
    })
}

const traverseAndUpdateSubFlow = (
    updater: (s: any) => void,
    root?: Step,
): boolean => {
    if (!root) {
        return false
    }

    let updated = false

    switch (root.type) {
        case 'ROUTER':
            for (const branch of root.children) {
                if (branch) {
                    updated = traverseAndUpdateSubFlow(updater, branch) || updated
                }
            }
            break
        case 'BRANCH':
            updated =
                traverseAndUpdateSubFlow(updater, root.onSuccessAction) || updated
            updated =
                traverseAndUpdateSubFlow(updater, root.onFailureAction) || updated
            updater(root)
            updated = true
            break
        case 'LOOP_ON_ITEMS':
            updated =
                traverseAndUpdateSubFlow(updater, root.firstLoopAction) || updated
            break
        case 'PIECE':
        case 'PIECE_TRIGGER':
            break
        default:
            break
    }

    updated = traverseAndUpdateSubFlow(updater, root.nextAction) || updated
    return updated
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const MigrateBranchToRouterRequest = {
    schema: {
        body: Type.Object({
            flowIds: Type.Optional(Type.Array(Type.String())),
            limit: Type.Optional(Type.Number({ default: 1000 })),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}