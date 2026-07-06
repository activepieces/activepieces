import { ProjectScopedMcpServer } from '@activepieces/shared'
import { afterEach, describe, expect, it } from 'vitest'
import { system } from '../../../../src/app/helper/system/system'
import { activepiecesTools, LOCKED_TOOL_NAMES, PLATFORM_LEVEL_TOOL_NAMES } from '../../../../src/app/mcp/tools'

// activepiecesTools only constructs tool definitions (the factories capture mcp/log in a closure and
// touch the DB lazily inside execute()), so a bare cast mock is enough to enumerate the registered set.
const log = system.globalLogger()
const mockMcp = { id: 'mcp-1', projectId: 'project-1', platformId: 'platform-1', tools: [], flows: [] } as unknown as ProjectScopedMcpServer

function toolTitles(): string[] {
    return activepiecesTools(mockMcp, undefined, log).map((tool) => tool.title)
}

describe('tool-search rollout flag (AP_TOOL_SEARCH_ENABLED)', () => {
    afterEach(() => {
        delete process.env.AP_TOOL_SEARCH_ENABLED
    })

    it('omits ap_search_actions and ap_search_triggers by default (flag unset → off)', () => {
        delete process.env.AP_TOOL_SEARCH_ENABLED

        const titles = toolTitles()

        expect(titles).not.toContain('ap_search_actions')
        expect(titles).not.toContain('ap_search_triggers')
    })

    it('registers both tool-search tools when the flag is on', () => {
        process.env.AP_TOOL_SEARCH_ENABLED = 'true'

        const titles = toolTitles()

        expect(titles).toContain('ap_search_actions')
        expect(titles).toContain('ap_search_triggers')
    })

    it('never force-locks the tool-search tools — the rollout flag must be able to keep them off', () => {
        // A LOCKED tool is force-on and cannot be disabled; the engine must stay gated by the flag, not pinned on.
        expect(LOCKED_TOOL_NAMES).not.toContain('ap_search_actions')
        expect(LOCKED_TOOL_NAMES).not.toContain('ap_search_triggers')
    })

    it('keeps both tools platform-level (catalog-wide search across all pieces)', () => {
        expect(PLATFORM_LEVEL_TOOL_NAMES).toContain('ap_search_actions')
        expect(PLATFORM_LEVEL_TOOL_NAMES).toContain('ap_search_triggers')
    })
})
