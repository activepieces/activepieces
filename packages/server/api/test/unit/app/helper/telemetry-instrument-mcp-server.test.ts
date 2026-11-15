import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockInstrument, mockGetEdition, mockGetEnvironment } = vi.hoisted(() => ({
    mockInstrument: vi.fn(),
    mockGetEdition: vi.fn(),
    mockGetEnvironment: vi.fn(),
}))

vi.mock('@posthog/mcp', () => ({
    instrument: mockInstrument,
}))

vi.mock('posthog-node', () => ({
    PostHog: vi.fn(function () {
        return { capture: vi.fn(), flush: vi.fn(), shutdown: vi.fn() }
    }),
}))

vi.mock('../../../../src/app/platform/platform-configuration.service', () => ({
    platformConfigurationService: vi.fn(),
}))

vi.mock('../../../../src/app/platform/platform.service', () => ({
    platformService: vi.fn(),
}))

vi.mock('../../../../src/app/project/project-service', () => ({
    projectService: vi.fn(),
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: { getEdition: mockGetEdition, get: mockGetEnvironment },
}))

import { instrumentMcpServer } from '../../../../src/app/helper/telemetry.utils'

const server = new McpServer({ name: 'test', version: '1.0.0' })

describe('instrumentMcpServer', () => {
    beforeEach(() => {
        mockInstrument.mockClear()
    })

    it('instruments the server on cloud in production', () => {
        mockGetEdition.mockReturnValue(ApEdition.CLOUD)
        mockGetEnvironment.mockReturnValue(ApEnvironment.PRODUCTION)

        instrumentMcpServer({ server, userId: 'user-1', platformId: 'platform-1' })

        expect(mockInstrument).toHaveBeenCalledTimes(1)
    })

    it('sends nothing from API tests, which run as cloud', () => {
        mockGetEdition.mockReturnValue(ApEdition.CLOUD)
        mockGetEnvironment.mockReturnValue(ApEnvironment.TESTING)

        instrumentMcpServer({ server, userId: 'user-1', platformId: 'platform-1' })

        expect(mockInstrument).not.toHaveBeenCalled()
    })

    it.each([ApEdition.COMMUNITY, ApEdition.ENTERPRISE])('sends nothing on %s', (edition) => {
        mockGetEdition.mockReturnValue(edition)
        mockGetEnvironment.mockReturnValue(ApEnvironment.PRODUCTION)

        instrumentMcpServer({ server, userId: 'user-1', platformId: 'platform-1' })

        expect(mockInstrument).not.toHaveBeenCalled()
    })
})
