import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { adminPlatformService } from './admin-platform.service'
import { Action, ActionType, AdminAddPlatformRequestBody, PackageType, PieceAction, PieceTrigger, PieceType, PrincipalType, Trigger, TriggerType } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { FlowVersionEntity } from '../../flows/flow-version/flow-version-entity'

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

    app.post('/fix', {
        schema: {
            body: Type.Array(Type.String()),
        },
        config: {
            allowedPrincipals: [PrincipalType.SUPER_USER],
        },
    }, async (req, res) => {
        const flowVersionIds = req.body
        for (const flowVersionId of flowVersionIds) {
            const flowVersion = await flowVersionRepo().findOneByOrFail({
                id: flowVersionId,
            })
            traverseAndUpdateSubFlow(flowVersion.trigger)
            await flowVersionRepo().update(flowVersionId, JSON.parse(JSON.stringify(flowVersion)))
        }
        return res.status(StatusCodes.OK).send()
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

const traverseAndUpdateSubFlow = (
    root?: Trigger | Action,
): boolean => {
    if (!root) {
        return false
    }

    let updated = false
    switch (root.type) {
        case ActionType.BRANCH:
            updated =
                traverseAndUpdateSubFlow(root.onSuccessAction) || updated
            updated =
                traverseAndUpdateSubFlow(root.onFailureAction) || updated
            break
        case ActionType.LOOP_ON_ITEMS:
            updated =
                traverseAndUpdateSubFlow(root.firstLoopAction) || updated
            break
        case ActionType.PIECE:
        case TriggerType.PIECE:
            addPackageTypeAndPieceTypeToPieceStepSettings(root)
            updated = true
            break
        default:
            break
    }

    updated = traverseAndUpdateSubFlow(root.nextAction) || updated
    return updated
}

const addPackageTypeAndPieceTypeToPieceStepSettings = (
    pieceStep: PieceAction | PieceTrigger,
): void => {
    pieceStep.settings.packageType = PackageType.REGISTRY
    pieceStep.settings.pieceType = PieceType.OFFICIAL
}
