import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import semVer from 'semver'
import { repoFactory } from '../../core/db/repo-factory'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { workerRedisConnections } from '../../../../../worker/src/lib/utils/worker-redis'

const CACHE_STATE_KEY = 'pieces_metadata_state'
let cache: PieceMetadataSchema[] = []

const repo = repoFactory(PieceMetadataEntity)
const lock: Mutex = new Mutex()

type State = {
    recentUpdate: string | undefined
    count: string
}

export const localPieceCache = (log: FastifyBaseLogger) => ({
    async getSortedbyNameAscThenVersionDesc(): Promise<PieceMetadataSchema[]> {
        const updatedRequired = await requireUpdate()
        if (!updatedRequired) {
            return cache
        }
        log.info({ time: dayjs().toISOString(), file: 'localPieceCache' }, 'Syncing pieces')
        cache = await lock.runExclusive(async () => {
            const updatedRequiredSecondCheck = await requireUpdate()
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

        await this.piecesUpdated()
        return cache
    },

    async piecesUpdated(): Promise<void> {
        const redis = await workerRedisConnections.useExisting();

        const newestState: State | undefined = await getNewestStateFromDB()
        if (isNil(newestState)) {
            return
        }
        await redis.set(CACHE_STATE_KEY, JSON.stringify(newestState))
    }
})

async function requireUpdate(): Promise<boolean> {
    let newestState: State | undefined = await getNewestStateFromRedis()
    if (isNil(newestState)) {
        newestState = await getNewestStateFromDB()
    }

    if (isNil(newestState)) {
        return false
    }

    const newestInCache = cache.reduce((acc, piece) => {
        return Math.max(dayjs(piece.updated).unix(), acc)
    }, 0)
    return dayjs(newestState.recentUpdate).unix() !== newestInCache || Number(newestState.count) !== cache.length
}

async function getNewestStateFromDB(): Promise<State | undefined> {
    return await repo().createQueryBuilder().select('MAX(updated)', 'recentUpdate').addSelect('count(*)', 'count').getRawOne()
}

async function getNewestStateFromRedis(): Promise<State | undefined> {
    const redis = await workerRedisConnections.useExisting();
    const stateString = await redis.get(CACHE_STATE_KEY)
    if (isNil(stateString)) {
        return undefined
    }
    return JSON.parse(stateString) as State
}
