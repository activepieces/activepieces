import Fastify from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'
import { validateEnvPropsOnStartup } from '../../../../src/app/helper/system-validator'

const FRONTEND_URL = 'https://example.com/activepieces'
const log = Fastify().log

function stubUrls({ mcpUrl }: { mcpUrl: string | undefined }): void {
    const realGet = system.get.bind(system)
    vi.spyOn(system, 'get').mockImplementation((prop) => {
        if (prop === AppSystemProp.MCP_URL) {
            return mcpUrl
        }
        if (prop === AppSystemProp.FRONTEND_URL) {
            return FRONTEND_URL
        }
        return realGet(prop)
    })
}

describe('validateEnvPropsOnStartup with AP_MCP_URL', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it.each([
        ['the frontend host root', 'https://example.com'],
        ['another path on the frontend host', 'https://example.com/mcp'],
        ['the frontend host in another case', 'https://EXAMPLE.com'],
    ])('refuses to start when AP_MCP_URL shares the frontend hostname at %s', async (_name, mcpUrl) => {
        stubUrls({ mcpUrl })

        await expect(validateEnvPropsOnStartup(log)).rejects.toThrow('AP_MCP_URL and AP_FRONTEND_URL share a hostname')
    })

    it.each([
        ['its own hostname', 'https://mcp.example.com'],
        ['the same value as AP_FRONTEND_URL', `${FRONTEND_URL}/`],
        ['nothing', undefined],
    ])('starts when AP_MCP_URL is set to %s', async (_name, mcpUrl) => {
        stubUrls({ mcpUrl })

        await expect(validateEnvPropsOnStartup(log)).resolves.toBeUndefined()
    })
})
