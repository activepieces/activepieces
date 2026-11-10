import { PlatformId } from '@activepieces/core-utils'
import { hooksFactory } from '../helper/hooks-factory'

export const eventDestinationHooks = hooksFactory.create<EventDestinationHooks>(() => ({
    async isDeliveryEntitled(): Promise<boolean> {
        return true
    },
    async listDeliveryEntitledPlatformIds({ platformIds }: ListDeliveryEntitledPlatformIdsParams): Promise<PlatformId[]> {
        return platformIds
    },
}))

export type EventDestinationHooks = {
    isDeliveryEntitled(params: IsDeliveryEntitledParams): Promise<boolean>
    listDeliveryEntitledPlatformIds(params: ListDeliveryEntitledPlatformIdsParams): Promise<PlatformId[]>
}

export type IsDeliveryEntitledParams = {
    platformId: PlatformId
}

export type ListDeliveryEntitledPlatformIdsParams = {
    platformIds: PlatformId[]
}
