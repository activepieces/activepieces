import { isNil } from '@activepieces/core-utils'
import { ApFlagId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flagService } from '../../flags/flag.service'
import { CatalogSnapshot } from './catalog-diff'

export const PIECE_CATALOG_SNAPSHOT_FLAG_ID = ApFlagId.PIECE_CATALOG_SNAPSHOT

export const catalogSnapshotStore = (log: FastifyBaseLogger) => ({
    async load(): Promise<CatalogSnapshot | null> {
        const flag = await flagService(log).getOne(PIECE_CATALOG_SNAPSHOT_FLAG_ID)
        if (isNil(flag)) {
            return null
        }
        return flag.value as CatalogSnapshot
    },
    async save(snapshot: CatalogSnapshot): Promise<void> {
        await flagService(log).save({ id: PIECE_CATALOG_SNAPSHOT_FLAG_ID, value: snapshot })
    },
})
