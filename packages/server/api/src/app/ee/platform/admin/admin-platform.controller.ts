import { AdminAddPlatformRequestBody, AdminRestoreFlowRequestBody, AdminRetryRunsRequestBody, ApEdition, assertNotNullOrUndefined, flowStructureUtil, isNil, PieceActionSettings, PieceTriggerSettings, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { flowService } from '../../../flows/flow/flow.service'
import { flowVersionRepo, flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { system } from '../../../helper/system/system'
import { pieceMetadataService } from '../../../pieces/piece-metadata-service'
import { projectService } from '../../../project/project-service'
import { adminPlatformService } from './admin-platform.service'

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

    app.post('/restore-flow-version', AdminRestoreFlowRequest, async (req, res) => {
        await adminPlatformService(req.log).restoreFlowVersion(req.body)
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

const AdminRetryRunsRequest = {
    schema: {
        body: AdminRetryRunsRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}


const AdminRestoreFlowRequest = {
    schema: {
        body: AdminRestoreFlowRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

