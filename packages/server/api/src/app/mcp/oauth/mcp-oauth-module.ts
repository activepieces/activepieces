import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { mcpOAuthAuthorizeController } from './mcp-oauth-authorize-controller'
import { mcpOAuthMetadataController } from './mcp-oauth-metadata-controller'
import { mcpOAuthRegisterController } from './mcp-oauth-register-controller'
import { mcpOAuthRevokeController } from './mcp-oauth-revoke-controller'
import { mcpOAuthTokenController } from './mcp-oauth-token-controller'

export const mcpOAuthRootModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(mcpOAuthMetadataController)
    await app.register(mcpOAuthRegisterController)
    await app.register(mcpOAuthAuthorizeController)
    await app.register(mcpOAuthTokenController)
    await app.register(mcpOAuthRevokeController)
}
