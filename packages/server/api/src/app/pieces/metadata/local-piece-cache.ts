import { isNil, Result, tryCatch } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import semVer from 'semver'
import { repoFactory } from '../../core/db/repo-factory'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'

let cache: PieceMetadataSchema[] = []

const repo = repoFactory(PieceMetadataEntity)

export const localPieceCache = (log: FastifyBaseLogger) => ({
    async getSortedbyNameAscThenVersionDesc(): Promise<PieceMetadataSchema[]> {
        return cache
    },
    async setup(): Promise<void> {
        const piecesResult = await fetchPieces()
        if (piecesResult.error) {
            log.error({ error: piecesResult.error }, '[localPieceCache] Error fetching local pieces')
            throw piecesResult.error
        }
        cache = piecesResult.data

        cron.schedule('*/15 * * * *', async () => {
            log.info('[localPieceCache] Refreshing pieces cache via cron job')

            const piecesResult = await fetchPieces()
            if (!isNil(piecesResult.data)) {
                cache = piecesResult.data
            }
        })
    },
})

// Removed the log arg since it's not used, and fixed types
async function fetchPieces(): Promise<Result<PieceMetadataSchema[], Error>> {
    const newestState: State | undefined = await repo()
        .createQueryBuilder()
        .select('MAX(updated)', 'recentUpdate')
        .addSelect('count(*)', 'count')
        .getRawOne()

    if (!isNil(newestState)) {
        const newestInCache = cache.reduce((acc, piece) => {
            return Math.max(dayjs(piece.updated).unix(), acc)
        }, 0)

        const needUpdate = dayjs(newestState.recentUpdate).unix() !== newestInCache || Number(newestState.count) !== cache.length
        if (!needUpdate) {
            return { data: cache, error: null }
        }
    }

    return tryCatch(async () => {
        const piecesFromDatabase = await repo().find()

        return piecesFromDatabase.sort((a, b) => {
            if (a.name !== b.name) {
                return a.name.localeCompare(b.name)
            }
            return semVer.rcompare(a.version, b.version)
        })
    })
}

type State = {
    recentUpdate: string | undefined
    count: string
}