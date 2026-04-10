import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { mcpOAuthRegisterController } from './client/mcp-oauth-register.controller'
import { mcpOAuthAuthorizeController } from './code/mcp-oauth-authorize.controller'
import { mcpOAuthMetadataController } from './metadata/mcp-oauth-metadata.controller'
import { mcpOAuthRevokeController } from './token/mcp-oauth-revoke.controller'
import { mcpOAuthTokenController } from './token/mcp-oauth-token.controller'

export const mcpOAuthRootModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(mcpOAuthMetadataController)
    await app.register(mcpOAuthRegisterController)
    await app.register(mcpOAuthAuthorizeController)
    await app.register(mcpOAuthTokenController)
    await app.register(mcpOAuthRevokeController)
}
