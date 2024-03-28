import dayjs from 'dayjs'
import { repoFactory } from '../../../core/db/repo-factory'
import { PieceMetadataEntity, PieceMetadataSchema } from '../../piece-metadata-entity'
import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import semVer from 'semver'

let cache: PieceMetadataSchema[] = []

const repo = repoFactory(PieceMetadataEntity)
const lock: Mutex = new Mutex()


export const localPieceCache = {
    async getSortedbyNameAscThenVersionDesc(): Promise<PieceMetadataSchema[]> {
        const newestPiece = await repo().createQueryBuilder().select('MAX(updated)', 'mx').getRawOne()
        const newestPieceDate = newestPiece?.mx
        if (!requireUpdate(newestPieceDate)) {
            return cache
        }
        cache = await executeWithLock(async () => {
            if (!requireUpdate(newestPieceDate)) {
                return cache
            }
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
}

function requireUpdate(newestPieceDate: string | undefined): boolean {
    if (isNil(newestPieceDate)) {
        return false
    }
    const newestInCache = cache.reduce((acc, piece) => {
        return Math.max(dayjs(piece.updated).unix(), acc)
    }, 0)
    return dayjs(newestPieceDate).unix() !== newestInCache
}

const executeWithLock = async <T>(methodToExecute: () => T): Promise<T> => {
    const releaseLock = await lock.acquire()

    try {
        return methodToExecute()
    }
    finally {
        releaseLock()
    }
}