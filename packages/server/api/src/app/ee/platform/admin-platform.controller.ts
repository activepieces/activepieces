import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import dayjs from 'dayjs'
import { StatusCodes } from 'http-status-codes'
import { isNil } from 'lodash'
import { databaseConnection } from '../../database/database-connection'
import { userService } from '../../user/user-service'
import { adminPlatformService } from './admin-platform.service'
import { logger } from '@activepieces/server-shared'
import { AdminAddPlatformRequestBody, PrincipalType } from '@activepieces/shared'

export const adminPlatformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await adminPlatformService.add(req.body)

        return res.status(StatusCodes.CREATED).send(newPlatform)
    })

    app.post('/temp-fix', TempFixRequest, async (req) => {
        let inserted = 0
        for (const item of req.body) {
            if (item.status === 'PENDING') {
                continue
            }
            const user = await userService.getByPlatformAndEmail({
                platformId: item.platformId,
                email: item.email,
            })
            if (isNil(user)) {
                continue
            }
            try {
                await databaseConnection.query('INSERT INTO project_member (id, created, updated, "projectId", "platformId", "userId", role) VALUES ($1, $2, $3, $4, $5, $6, $7)', [
                    item.id,
                    dayjs(item.created).toISOString(),
                    dayjs(item.updated).toISOString(),
                    item.projectId,
                    item.platformId,
                    user.id,
                    item.role,
                ])
                inserted++

            }
            catch (e) {
                logger.error(e)
            }
        }
        return {
            inserted,
        }
    })
}

// id, created, updated, "projectId", role, status, email, "platformId"
const TempFixRequest = {
    schema: {
        body: Type.Array(Type.Object({
            id: Type.String(),
            created: Type.String(),
            updated: Type.String(),
            projectId: Type.String(),
            role: Type.String(),
            status: Type.String(),
            email: Type.String(),
            platformId: Type.String(),
        })),
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}
const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}