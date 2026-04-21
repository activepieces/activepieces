---
name: add-endpoint
description: "Use when adding a new API endpoint, route, or HTTP handler. ALWAYS use for new Fastify controller endpoints."
---

# Add API Endpoint

Create endpoint for $ARGUMENTS.

## Steps

1. **Read the pattern**: Open `packages/server/api/src/app/tables/table/table.controller.ts` as reference.

2. **Create or update controller** using `FastifyPluginAsyncZod`:
   ```typescript
   export const myController: FastifyPluginAsyncZod = async (fastify) => {
       fastify.post('/', CreateRequest, async (request) => {
           return myService(request.log).create({
               projectId: request.projectId,
               request: request.body,
           })
       })
   }
   ```

3. **Define route config AFTER the controller** (not inline):
   ```typescript
   const CreateRequest = {
       config: {
           security: securityAccess.project(
               [PrincipalType.USER, PrincipalType.ENGINE, PrincipalType.SERVICE],
               Permission.WRITE_MY_FEATURE,
               { type: ProjectResourceType.BODY },
           ),
       },
       schema: {
           tags: ['my-feature'],
           body: CreateMyFeatureRequest,  // Zod schema from @activepieces/shared
           response: { [StatusCodes.CREATED]: MyFeature },
       },
   }
   ```

4. **Security access** (pick one):
   - `securityAccess.project(principals, permission, { type: ProjectResourceType.X })` — project-scoped
   - `securityAccess.platformAdminOnly(principals)` — admin only
   - `securityAccess.publicPlatform(principals)` — any platform member
   - `securityAccess.public()` — no auth

5. **Create module** and register in `app.ts`:
   ```typescript
   export const myModule: FastifyPluginAsyncZod = async (app) => {
       app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
       await app.register(myController, { prefix: '/v1/my-features' })
   }
   ```

6. **Add Permission** if new: add to `Permission` enum in `@activepieces/shared`.

7. **Verify**: `npm run lint-dev`
