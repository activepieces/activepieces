import { FastifyBaseLogger } from 'fastify'
import semVer from 'semver'
import { repoFactory } from '../../core/db/repo-factory'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { tryCatch } from '@activepieces/shared';
import dayjs from 'dayjs';

let cache: PieceMetadataSchema[] = []

const repo = repoFactory(PieceMetadataEntity)

type State = {
    recentUpdate: string | undefined
    count: string
}

export const localPieceCache = (log: FastifyBaseLogger) => ({
    async getSortedbyNameAscThenVersionDesc(): Promise<PieceMetadataSchema[]> {
        if (!cache.length) {
            cache = await this.fetchPieces()
        }

        return cache
    },

    async fetchPieces(): Promise<PieceMetadataSchema[]> {
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
                    return a.name.localeCompare(b.name);
                }
                return semVer.rcompare(a.version, b.version);
            });
        })
        if (error) {
            log.error({ error }, 'Error fetching local pieces');
            return [];
        }

        return data
    },

    async updateCache(pieces: PieceMetadataSchema[]): Promise<void> {
        cache = pieces
    },
})
