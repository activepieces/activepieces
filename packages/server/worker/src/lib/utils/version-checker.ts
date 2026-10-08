import { apVersionUtil, onCallService, UNKNOWN_VERSION } from '@activepieces/server-utils'
import { logger } from '../config/logger'
import { workerSettings } from '../config/worker-settings'

const AP_VERSION = apVersionUtil.getCurrentRelease()

let pagedForUnreadableWorkerVersion = false

function pageOnceForUnreadableWorkerVersion(workerLog: typeof logger): void {
    if (pagedForUnreadableWorkerVersion) {
        return
    }
    pagedForUnreadableWorkerVersion = true
    onCallService(workerLog, workerSettings.getSettings().PAGE_ONCALL_WEBHOOK).page({
        code: 'WORKER_VERSION_READ_FAILED',
        message: 'Worker could not read its release version from package.json (reported as 0.0.0); polling is paused and will NOT self-heal on reconnect until the deployment is fixed (check cwd/packaging)',
        params: { workerVersion: AP_VERSION },
    }).catch((pageError) => {
        workerLog.error({ pageError }, 'Failed to send on-call page for unreadable worker version')
    })
}

function connectedAppVersionIsCompatible(workerLog: typeof logger): boolean {
    const appVersion = workerSettings.getSettings().APP_VERSION
    if (apVersionUtil.versionsAreCompatible({ versionA: appVersion, versionB: AP_VERSION })) {
        return true
    }
    const versionUnreadable = appVersion === UNKNOWN_VERSION || AP_VERSION === UNKNOWN_VERSION
    if (versionUnreadable) {
        workerLog.error({ appVersion, workerVersion: AP_VERSION }, 'Withholding work (polling and prewarm paused) — a release version could not be read from package.json (reported as 0.0.0); this will NOT self-heal on reconnect, check the worker/app deployment (cwd/packaging)')
    }
    else {
        workerLog.warn({ appVersion, workerVersion: AP_VERSION }, 'Connected app version mismatch — withholding work (polling and prewarm paused) until reconnect to a compatible app')
    }
    if (AP_VERSION === UNKNOWN_VERSION) {
        pageOnceForUnreadableWorkerVersion(workerLog)
    }
    return false
}

// Front-loads the release-read failure signal to worker boot so a mis-packaged worker that hasn't
// polled yet doesn't silently look healthy in the logs. This only LOGS: the on-call page needs
// PAGE_ONCALL_WEBHOOK, which arrives with worker settings on socket connect and is not available at
// boot, so paging is left to the poll loop's version-compatibility check (which calls
// pageOnceForUnreadableWorkerVersion, once-guarded, as soon as settings are loaded). A '0.0.0' read
// pauses polling and will NOT self-heal on reconnect until the deployment is fixed.
function assertReleaseReadable(): void {
    if (AP_VERSION !== UNKNOWN_VERSION) {
        logger.info({ release: { version: AP_VERSION } }, 'Release version detected from package.json')
        return
    }
    logger.error({ release: { version: AP_VERSION } }, 'Worker could not read its release version from package.json (reported as 0.0.0); polling is paused and will NOT self-heal on reconnect until the deployment is fixed (check cwd/packaging)')
}

export const versionChecker = {
    workerVersion: AP_VERSION,
    connectedAppVersionIsCompatible,
    assertReleaseReadable,
}

export const VERSION_MISMATCH_POLL_PAUSE_MS = 10_000
