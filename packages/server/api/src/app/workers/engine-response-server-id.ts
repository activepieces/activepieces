/**
 * Experiment: stable-engine-response-server-id
 * Sync webhooks can hang when APP and WORKER use different Redis pub/sub channel ids.
 * Stable shared id is enabled by default (AP_STABLE_ENGINE_RESPONSE_SERVER_ID_ENABLED, default true).
 *
 * Retain B side: remove BEGIN/END "A side" blocks in this file, engine-response-server-id.test.ts,
 *   and engine-response-watcher-multi-process.test.ts; remove flag check (keep B branch body only).
 * Retain A side: remove BEGIN/END "B side" blocks in those same files; remove B-side env props from
 *   system-props.ts and system-validator.ts (BEGIN/END stable-engine-response-server-id B side).
 */
import { createHash } from 'node:crypto'
import { apId, ApId } from '@activepieces/shared'
import { system } from '@api/helper/system/system'
import { AppSystemProp } from '@api/helper/system/system-props'

let cachedServerId: string | undefined

function isStableEngineResponseServerIdEnabled(): boolean {
    return system.getBoolean(AppSystemProp.STABLE_ENGINE_RESPONSE_SERVER_ID_ENABLED) ?? true
}

// BEGIN stable-engine-response-server-id B side (delete this block if experiment retains A side)
function resolveStableEngineResponseServerId(): string {
    const configuredId = system.get(AppSystemProp.ENGINE_RESPONSE_SERVER_ID)
    if (configuredId) {
        return configuredId
    }
    const encryptionKey = system.getOrThrow(AppSystemProp.ENCRYPTION_KEY)
    const digest = createHash('sha256').update(encryptionKey).digest('hex')
    const stableId = digest.slice(0, 21)
    ApId.parse(stableId)
    return stableId
}
// END stable-engine-response-server-id B side

function buildEngineResponseServerId(): string {
    if (isStableEngineResponseServerIdEnabled()) {
        return resolveStableEngineResponseServerId()
    }
    // BEGIN stable-engine-response-server-id A side (delete this branch if experiment retains B side)
    return apId()
    // END stable-engine-response-server-id A side
}

export function getEngineResponseServerId(): string {
    if (cachedServerId === undefined) {
        cachedServerId = buildEngineResponseServerId()
    }
    return cachedServerId
}
