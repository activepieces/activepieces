import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import semVer from 'semver'
import { repoFactory } from '../../../core/db/repo-factory'
import { PieceMetadataEntity, PieceMetadataSchema } from '../../piece-metadata-entity'

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
        return cache
    },
})

async function requireUpdate(): Promise<boolean> {
    const newestState: State | undefined = await repo().createQueryBuilder().select('MAX(updated)', 'recentUpdate').addSelect('count(*)', 'count').getRawOne()
    if (isNil(newestState)) {
        return false
    }
    const newestInCache = cache.reduce((acc, piece) => {
        return Math.max(dayjs(piece.updated).unix(), acc)
    }, 0)
    return dayjs(newestState.recentUpdate).unix() !== newestInCache || Number(newestState.count) !== cache.length
}