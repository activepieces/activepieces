import { assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import semVer from 'semver'
import { repoFactory } from '../../../core/db/repo-factory'
import { distributedStore } from '../../../helper/keyvalue'
import { PieceMetadataEntity, PieceMetadataSchema } from '../../piece-metadata-entity'

const cacheKey = 'cachePieceUpdated'

const repo = repoFactory(PieceMetadataEntity)
const lock: Mutex = new Mutex()
let cache: PieceMetadataSchema[] = []

export const localPieceCache = (log: FastifyBaseLogger) => ({
    async getSortedbyNameAscThenVersionDesc(): Promise<PieceMetadataSchema[]> {
        const updatedRequired = await requireUpdate(log)
        if (!updatedRequired) {
            return cache
        }
        log.info({ time: dayjs().toISOString(), file: 'localPieceCache' }, 'Syncing pieces')
        cache = await lock.runExclusive(async () => {
            const updatedRequiredSecondCheck = await requireUpdate(log)
            if (!updatedRequiredSecondCheck) {
                return cache
            }
            log.info('Syncing pieces from database')
            const result = await repo().find()
            return result.sort((a, b) => {
                if (a.name !== b.name) {
                    return a.name.localeCompare(b.name)
                }
                return semVer.rcompare(a.version, b.version)
            })
        })
        return cache
    },
    async updateCacheState(): Promise<State> {
        const newestState: State | undefined = await repo().createQueryBuilder().select('MAX(updated)', 'recentUpdate').addSelect('count(*)', 'count').getRawOne()
        assertNotNullOrUndefined(newestState, 'newestState is undefined')
        await distributedStore().put(cacheKey, newestState)
        return newestState
    },
})

async function getCacheState(log: FastifyBaseLogger): Promise<State> {
    const newestState: State | null = await distributedStore().get(cacheKey)
    if (isNil(newestState)) {
        log.info('Cache state not found, updating cache state')
        return localPieceCache(log).updateCacheState()
    }
    return newestState
}

async function requireUpdate(log: FastifyBaseLogger): Promise<boolean> {
    const newestState: State = await getCacheState(log)
    const newestInCache = cache.reduce((acc, piece) => Math.max(dayjs(piece.updated).unix(), acc), 0)
    return dayjs(newestState.recentUpdate).unix() !== newestInCache || Number(newestState.count) !== cache.length
}

type State = {
    recentUpdate: string | undefined
    count: string
}
