import { isNil } from '@activepieces/core-utils'
import { apDayjs, apVersionUtil } from '@activepieces/server-utils'
import { ApEdition, PieceSyncMode, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedLock } from '../../database/redis-connections'
import { eventDestinationService } from '../../event-destinations/event-destinations.service'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { pieceRepos } from '../metadata/piece-metadata-service'
import { isSupportedRelease, lastVersionOfEachPiece } from '../metadata/utils'
import { CatalogEntry, diffCatalog } from './catalog-diff'
import { catalogSnapshotStore } from './catalog-snapshot-store'

const LOCK_KEY = 'piece-catalog-events'
const LOCK_TIMEOUT_SECONDS = 120
const BASE_JOB_ID = 'piece-catalog-events'
const FOLLOW_UP_JOB_ID = 'piece-catalog-events-follow-up'
const RECONCILE_CRON = '45 * * * *'

export const pieceCatalogEventsJob = (log: FastifyBaseLogger) => ({
    register(): void {
        systemJobHandlers.registerJobHandler(SystemJobName.PIECE_CATALOG_EVENTS, async () => run(log))
        systemJobHandlers.registerJobHandler(SystemJobName.PIECE_CATALOG_RECONCILE, async () => {
            await pieceCatalogEventsJob(log).seedAtBootIfSyncOff()
            await run(log)
        })
    },
    async enqueue(): Promise<void> {
        if (isCommunity()) {
            return
        }
        const jobId = await findIdleJobId(log)
        if (isNil(jobId)) {
            return
        }
        await systemJobsSchedule(log).upsertJob({
            job: { name: SystemJobName.PIECE_CATALOG_EVENTS, data: {}, jobId },
            schedule: { type: 'one-time', date: apDayjs() },
        })
    },
    async onSyncFinished({ added, deleted, fetchFailed }: SyncFinishedParams): Promise<void> {
        if (isCommunity()) {
            return
        }
        if (fetchFailed === 0) {
            await seedIfMissing({ allowEmptyCatalog: false, log })
        }
        if (added > 0 || deleted > 0) {
            await pieceCatalogEventsJob(log).enqueue()
        }
    },
    async seedAtBootIfSyncOff(): Promise<void> {
        if (isCommunity() || system.get<PieceSyncMode>(AppSystemProp.PIECES_SYNC_MODE) === PieceSyncMode.OFFICIAL_AUTO) {
            return
        }
        try {
            await seedIfMissing({ allowEmptyCatalog: true, log })
        }
        catch (err) {
            log.error({ err }, '[pieceCatalogEvents] boot seed failed')
        }
    },
    async scheduleReconcile(): Promise<void> {
        if (isCommunity()) {
            return
        }
        await systemJobsSchedule(log).upsertJob({
            job: { name: SystemJobName.PIECE_CATALOG_RECONCILE, data: {}, jobId: SystemJobName.PIECE_CATALOG_RECONCILE },
            schedule: { type: 'repeated', cron: RECONCILE_CRON },
        })
    },
})

function isCommunity(): boolean {
    return system.getEdition() === ApEdition.COMMUNITY
}

async function findIdleJobId(log: FastifyBaseLogger): Promise<string | null> {
    for (const jobId of [BASE_JOB_ID, FOLLOW_UP_JOB_ID]) {
        if (await systemJobsSchedule(log).getJobState(jobId) !== 'active') {
            return jobId
        }
    }
    return null
}

async function run(log: FastifyBaseLogger): Promise<void> {
    if (isCommunity()) {
        return
    }
    await distributedLock(log).runExclusive({
        key: LOCK_KEY,
        timeoutInSeconds: LOCK_TIMEOUT_SECONDS,
        fn: async () => {
            const startTime = performance.now()
            const store = catalogSnapshotStore(log)
            const snapshot = await store.load()
            if (isNil(snapshot)) {
                log.info('[pieceCatalogEvents] no snapshot yet')
                return
            }
            const { changes, nextSnapshot } = diffCatalog({ snapshot, current: await listOfficialLatest() })
            const { queued, failedPlatformIds } = changes.length > 0 ? await eventDestinationService(log).broadcast({ changes }) : { queued: 0, failedPlatformIds: [] }
            await store.save(nextSnapshot)
            log.info({ changes: changes.length, queued, failedPlatforms: failedPlatformIds.length, durationMs: Math.floor(performance.now() - startTime), seeded: false }, '[pieceCatalogEvents] run')
            if (failedPlatformIds.length > 0) {
                throw new Error(`[pieceCatalogEvents] broadcast failed for ${failedPlatformIds.length} platform(s): ${failedPlatformIds.join(', ')}`)
            }
        },
    })
}

async function seedIfMissing({ allowEmptyCatalog, log }: { allowEmptyCatalog: boolean, log: FastifyBaseLogger }): Promise<void> {
    await distributedLock(log).runExclusive({
        key: LOCK_KEY,
        timeoutInSeconds: LOCK_TIMEOUT_SECONDS,
        fn: async () => {
            const store = catalogSnapshotStore(log)
            if (!isNil(await store.load())) {
                return
            }
            const current = await listOfficialLatest()
            if (current.length === 0 && !allowEmptyCatalog) {
                return
            }
            await store.save(Object.fromEntries(current.map((entry) => [entry.name, entry.version])))
            log.info({ pieces: current.length, seeded: true }, '[pieceCatalogEvents] seed')
        },
    })
}

async function listOfficialLatest(): Promise<CatalogEntry[]> {
    const release = apVersionUtil.getCurrentRelease()
    const rows = await pieceRepos().find({
        select: { name: true, displayName: true, version: true, minimumSupportedRelease: true, maximumSupportedRelease: true, deprecated: true },
        where: { pieceType: PieceType.OFFICIAL },
    })
    return lastVersionOfEachPiece(rows.filter((row) => isSupportedRelease(release, row))).map((row) => ({
        name: row.name,
        displayName: row.displayName,
        version: row.version,
        minimumSupportedRelease: row.minimumSupportedRelease ?? null,
        deprecated: row.deprecated ?? false,
    }))
}

type SyncFinishedParams = {
    added: number
    deleted: number
    fetchFailed: number
}
