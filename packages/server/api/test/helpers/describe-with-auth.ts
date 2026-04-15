import { FastifyInstance } from 'fastify'
import { createServiceContext, createTestContext, TestContext, TestContextParams } from './test-context'

export function describeWithAuth(
    name: string,
    getApp: () => FastifyInstance,
    fn: (setup: () => Promise<TestContext>) => void,
    params?: TestContextParams,
): void {
    describe.each(['USER', 'SERVICE'] as const)(`${name} [%s]`, (authType) => {
        const setup = async (): Promise<TestContext> => {
            const userCtx = await createTestContext(getApp(), params)
            if (authType === 'SERVICE') {
                return createServiceContext(getApp(), userCtx)
            }
            return userCtx
        }
        fn(setup)
    })
}
