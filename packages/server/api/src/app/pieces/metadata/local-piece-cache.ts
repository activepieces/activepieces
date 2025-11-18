import { FastifyBaseLogger } from 'fastify'
import semVer from 'semver'
import cron from 'node-cron'
import { repoFactory } from '../../core/db/repo-factory'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { tryCatch } from '@activepieces/shared'
import dayjs from 'dayjs'

let cache: PieceMetadataSchema[] = []

const repo = repoFactory(PieceMetadataEntity)

type State = {
    recentUpdate: string | undefined
    count: string
}

export const localPieceCache = (log: FastifyBaseLogger) => ({
    async setup(): Promise<void> {
        cache = await fetchPieces(log)

        cron.schedule('*/15 * * * *', async () => {
            log.info('[localPieceCache] Refreshing pieces cache via cron job')

            cache = await fetchPieces(log)
        })
    },

    async getSortedbyNameAscThenVersionDesc(): Promise<PieceMetadataSchema[]> {
        if (!cache.length) {
            cache = await fetchPieces(log)
        }

        return cache
    },
})

async function fetchPieces(log: FastifyBaseLogger): Promise<PieceMetadataSchema[]> {
    const newestState: State | undefined = await repo()
        .createQueryBuilder()
        .select('MAX(updated)', 'recentUpdate')
        .addSelect('count(*)', 'count')
        .getRawOne()

    if (newestState) {
        const newestInCache = cache.reduce((acc, piece) => {
            return Math.max(dayjs(piece.updated).unix(), acc)
        }, 0)

        const needUpdate = dayjs(newestState.recentUpdate).unix() !== newestInCache || Number(newestState.count) !== cache.length
        if (!needUpdate) {
            return cache
        }
    }

    const { data, error } = await tryCatch(async () => {
        const piecesFromDatabase = await repo().find();

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
        });
    })
    if (error) {
        log.error({ error }, 'Error fetching local pieces');

        throw error
    }

    return data
}
