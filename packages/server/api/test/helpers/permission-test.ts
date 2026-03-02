import { DefaultProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createMemberContext, createTestContext, TestContext } from './test-context'

export function describeRolePermissions(config: RolePermissionConfig): void {
    const {
        app,
        request,
        allowedRoles,
        forbiddenRoles,
        beforeEach: beforeEachFn,
    } = config

    if (allowedRoles.length > 0) {
        it.each(allowedRoles)('Succeeds if user role is %s', async (role) => {
            const ctx = await createTestContext(app())
            const memberCtx = await createMemberContext(app(), ctx, { projectRole: role })
            if (beforeEachFn) {
                await beforeEachFn(ctx)
            }
            const response = await request(memberCtx, ctx)
            expect(response.statusCode).not.toBe(StatusCodes.FORBIDDEN)
        })
    }

    if (forbiddenRoles.length > 0) {
        it.each(forbiddenRoles)('Fails if user role is %s', async (role) => {
            const ctx = await createTestContext(app())
            const memberCtx = await createMemberContext(app(), ctx, { projectRole: role })
            if (beforeEachFn) {
                await beforeEachFn(ctx)
            }
            const response = await request(memberCtx, ctx)
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response.json()
            expect(responseBody?.code).toBe('PERMISSION_DENIED')
            expect(responseBody?.params?.userId).toBe(memberCtx.user.id)
            expect(responseBody?.params?.projectId).toBe(ctx.project.id)
        })
    }
}

type RolePermissionConfig = {
    app: () => FastifyInstance
    request: (memberCtx: TestContext, ownerCtx: TestContext) => ReturnType<FastifyInstance['inject']>
    allowedRoles: DefaultProjectRole[]
    forbiddenRoles: DefaultProjectRole[]
    beforeEach?: (ctx: TestContext) => Promise<void>
}
