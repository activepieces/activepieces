import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

/**
 * Master rollout switch for the tool-search engine (default off). Read live per call — `getBoolean`
 * reads the env each time, so flipping AP_TOOL_SEARCH_ENABLED takes effect without a process restart.
 * Owned by the engine so consumers (mcp/tools, the boot backfill) depend on tool-search, never the
 * reverse. When off: the search tools don't register and the cold-start backfill no-ops.
 */
export function isToolSearchEnabled(): boolean {
    return system.getBoolean(AppSystemProp.TOOL_SEARCH_ENABLED) ?? false
}
