import { FastifyBaseLogger } from 'fastify'
import semVer from 'semver'
import { repoFactory } from '../../core/db/repo-factory'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'

let cache: PieceMetadataSchema[] = []

const repo = repoFactory(PieceMetadataEntity)

export const localPieceCache = (log: FastifyBaseLogger) => ({
    async getSortedbyNameAscThenVersionDesc(): Promise<PieceMetadataSchema[]> {
        if (!cache.length) {
            await this.refreshPiecesCache()
        }

        return cache
    },

    async refreshPiecesCache(): Promise<void> {
        try {
            const result = await repo().find()

            result.sort((a, b) => {
                if (a.name !== b.name) {
                    return a.name.localeCompare(b.name)
                }
                return semVer.rcompare(a.version, b.version)
            })

            cache = result

            log.info('Local piece cache refreshed successfully')
        }
        catch (error) {
            log.error({ error }, 'Error refreshing local piece cache')
        }
    }
})
