import { AppSystemProp, memoryLock, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ApEnvironment, isNil, Result, tryCatch } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import semVer from 'semver'
import { repoFactory } from '../../core/db/repo-factory'
import { pubsub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'

let cache: PieceMetadataSchema[] | null = null
const repo = repoFactory(PieceMetadataEntity)
const environment = system.get<ApEnvironment>(AppSystemProp.ENVIRONMENT)

export const REDIS_REFRESH_LOCAL_PIECES_CHANNEL = 'refresh-local-pieces-cache'

type State = {
    recentUpdate: string | undefined
    count: string
}

export const localPieceCache = (log: FastifyBaseLogger) => ({
    async setup(): Promise<void> {
        await updateCache(log)
        cron.schedule('*/15 * * * *', () => {
            log.info('[localPieceCache] Refreshing pieces cache via cron job')
            rejectedPromiseHandler(updateCache(log), log)
        })
        await pubsub.subscribe(REDIS_REFRESH_LOCAL_PIECES_CHANNEL, () => {
            log.info('[localPieceCache] Refreshing pieces cache via pubsub')
            rejectedPromiseHandler(updateCache(log), log)
        })
    },
    async refresh(): Promise<void> {
        await updateCache(log)
    },
    async getSortedbyNameAscThenVersionDesc(): Promise<PieceMetadataSchema[]> {
        if (environment === ApEnvironment.TESTING) {
            const { data, error } = await fetchPieces()
            if (error) {
                throw error
            }
            return data
        }
        if (isNil(cache)) {
            throw new Error('The cache is not yet initialized, this should not happen')
        }
        return cache
    },
})

async function updateCache(log: FastifyBaseLogger): Promise<void> {
    const piecesResult = await fetchPieces()
    if (piecesResult.error) {
        log.error({ error: piecesResult.error }, '[localPieceCache] Error fetching local pieces')
        throw piecesResult.error
    }
    cache = piecesResult.data
}

async function fetchPieces(): Promise<Result<PieceMetadataSchema[], Error>> {
    return memoryLock.runExclusive({
        key: 'fetch-pieces',
        fn: async () => {
            const newestState: State | undefined = await repo()
                .createQueryBuilder()
                .select('MAX(updated)', 'recentUpdate')
                .addSelect('count(*)', 'count')
                .getRawOne()

            if (!isNil(newestState) && cache !== null) {
                const newestInCache = cache.reduce((acc, piece) => {
                    return Math.max(dayjs(piece.updated).unix(), acc)
                }, 0)

                const needUpdate = dayjs(newestState.recentUpdate).unix() !== newestInCache || Number(newestState.count) !== cache.length
                if (!needUpdate) {
                    return { data: cache as PieceMetadataSchema[], error: null }
                }
            }

            return tryCatch(async () => {
                const piecesFromDatabase = await repo().find()
                return piecesFromDatabase.sort((a, b) => {
                    if (a.name !== b.name) {
                        return a.name.localeCompare(b.name)
                    }
                    const aValid = semVer.valid(a.version)
                    const bValid = semVer.valid(b.version)
                    if (!aValid && !bValid) {
                        return b.version.localeCompare(a.version)
                    }
                    if (!aValid) {
                        return 1
                    }
                    if (!bValid) {
                        return -1
                    }
                    return semVer.rcompare(a.version, b.version)
                })
            })
        },
    })
}

