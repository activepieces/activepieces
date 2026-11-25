import { existsSync } from 'node:fs'
import path from 'node:path'
import { isNil } from '@activepieces/core-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import { platformAdminApi } from '../../../../src/app/mcp/platform-admin/platform-admin-api'
import { setupTestEnvironment } from '../../../helpers/test-setup'

beforeAll(async () => {
    await setupTestEnvironment()
})

describe('platform admin MCP routes', () => {
    it('every admin-only route declares config.mcp', () => {
        const unannotated = platformAdminApi.routes()
            .filter((route) => isNil(route.mcp))
            .map((route) => `${route.method} ${route.url}`)
        expect(unannotated, 'Add app.addHook(\'onRoute\', platformAdminApi.page(\'<doc under docs/, no .mdx>\')) to the controller, or mcp: { deny: true } to the route config').toEqual([])
    })

    it('every exposed route points at a doc that exists', () => {
        const missingDocs = platformAdminApi.exposedRoutes()
            .filter((route) => !existsSync(path.resolve('docs', `${route.doc}.mdx`)))
            .map((route) => `${route.method} ${route.url} -> docs/${route.doc}.mdx`)
        expect(missingDocs, 'Write the doc page, or point the controller at an existing one').toEqual([])
    })
})
