import { AdminAddPlatformRequestBody, PrincipalType, Step, RouterExecutionType, BranchExecutionType, flowStructureUtil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { adminPlatformService } from './admin-platform.service'
import { repoFactory } from '../../core/db/repo-factory'
import { FlowVersionEntity } from '../../flows/flow-version/flow-version-entity'
import { In } from 'typeorm'

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
                flowId: In(req.body.flowIds),
            },
        })

        for (const flowVersion of flowVersions) {
            const originalSize = flowStructureUtil.getAllSteps(flowVersion.trigger).length
            flowVersion.trigger = traverseAndUpdateSubFlow((step: any) => {
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
            }, flowVersion.trigger)!

            const updatedStepsSize = flowStructureUtil.getAllSteps(flowVersion.trigger).length
            if (originalSize !== updatedStepsSize) {
                throw new Error(`steps size mismatch for flow: ${flowVersion.displayName} original: ${originalSize} updated: ${updatedStepsSize}`)
            }
            const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
            const hasBranchSteps = allSteps.some(s => (s as any).type === 'BRANCH')
            if (hasBranchSteps) {
                throw new Error(`flow ${flowVersion.displayName} still contains branch steps after migration`)
            }
            await flowVersionRepo().save({
                ...flowVersion,
                schemaVersion: '1',
            })
        }

        return res.status(StatusCodes.OK).send(flowVersions.length)
    })
}

const traverseAndUpdateSubFlow = (
    updater: (s: Step) => void,
    root: Step | undefined,
): any => {
    if (!root) {
        return undefined
    }

    const clonedRoot = JSON.parse(JSON.stringify(root))

    switch (clonedRoot.type) {
        case 'ROUTER':
            const updatedChildren: (Step | null)[] = []
            for (const branch of clonedRoot.children) {
                if (branch) {
                    const branchUpdated = traverseAndUpdateSubFlow(updater, branch)
                    updatedChildren.push(branchUpdated ?? null)
                }
                else {
                    updatedChildren.push(null)
                }
            }
            clonedRoot.children = updatedChildren
            break
        case 'BRANCH':
            clonedRoot.onSuccessAction = clonedRoot.onSuccessAction ?
                traverseAndUpdateSubFlow(updater, clonedRoot.onSuccessAction) : undefined
            clonedRoot.onFailureAction = clonedRoot.onFailureAction ?
                traverseAndUpdateSubFlow(updater, clonedRoot.onFailureAction) : undefined
            updater(clonedRoot)
            break
        case 'LOOP_ON_ITEMS':
            clonedRoot.firstLoopAction = clonedRoot.firstLoopAction ?
                traverseAndUpdateSubFlow(updater, clonedRoot.firstLoopAction) : undefined
            break
        case 'PIECE':
        case 'PIECE_TRIGGER':
            break
        default:
            break
    }

    clonedRoot.nextAction = clonedRoot.nextAction ?
        traverseAndUpdateSubFlow(updater, clonedRoot.nextAction) : undefined

    return clonedRoot
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
            flowIds: Type.Array(Type.String()),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}