import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { knowledgeBaseSchema } from './knowledge-base-schema'
import { knowledgeBaseController } from './knowledge-base.controller'

export const knowledgeBaseModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', async () => {
        const available = await knowledgeBaseSchema.isVectorExtensionInstalled()
        if (!available) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'Knowledge base requires the pgvector extension. Ask your database administrator to run `CREATE EXTENSION vector;` in the Activepieces database, then restart.',
                },
            })
        }
    })
    await app.register(knowledgeBaseController, { prefix: '/v1/knowledge-base/files' })
}
