import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'
import semVer from 'semver'
import { repoFactory } from '../../../core/db/repo-factory'
import { PieceMetadataEntity, PieceMetadataSchema } from '../../piece-metadata-entity'
import { isNil } from '@activepieces/shared'

let cache: PieceMetadataSchema[] = []

const repo = repoFactory(PieceMetadataEntity)
const lock: Mutex = new Mutex()

type State = {
    recentUpdate: string | undefined
    count: number
}

export const localPieceCache = {
    async getSortedbyNameAscThenVersionDesc(): Promise<PieceMetadataSchema[]> {
        const newestState: State | undefined = await repo().createQueryBuilder().select('MAX(updated)', 'recentUpdate').addSelect('count(*)', 'count').getRawOne()
        if (!requireUpdate(newestState)) {
            return cache
        }
        cache = await executeWithLock(async () => {
            if (!requireUpdate(newestState)) {
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

function requireUpdate(newestState: State | undefined): boolean {
    if (isNil(newestState)) {
        return false
    }
    const newestInCache = cache.reduce((acc, piece) => {
        return Math.max(dayjs(piece.updated).unix(), acc)
    }, 0)
    return dayjs(newestState.recentUpdate).unix() !== newestInCache || newestState.count !== cache.length
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