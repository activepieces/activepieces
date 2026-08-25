import { ApEdition } from '../../core/flag/flag'

/**
 * Single source of truth for whether the Agents surface exists on a platform.
 * Two gates, and they answer different questions. `AP_AGENTS_ENABLED` is the
 * release gate: whether this deployment shows Agents at all. `plan.agentsEnabled`
 * is the billing gate, and a billing provider only owns it on Cloud — on a
 * self-host nothing ever grants it, so requiring it there leaves an operator who
 * turned the feature on with a surface they cannot reach and no way to find out why.
 */
function resolveAgentsEnabled({ edition, releaseEnabled, planAgentsEnabled }: ResolveAgentsEnabledParams): boolean {
    if (!releaseEnabled) {
        return false
    }
    return edition === ApEdition.CLOUD ? planAgentsEnabled : true
}

export const agentVisibility = {
    resolveAgentsEnabled,
}

export type ResolveAgentsEnabledParams = {
    edition: ApEdition
    releaseEnabled: boolean
    planAgentsEnabled: boolean
}
