import { PlatformId } from '@activepieces/core-utils'
import { hooksFactory } from '../helper/hooks-factory'

export const eventDestinationHooks = hooksFactory.create<EventDestinationHooks>(() => ({
    async isDeliveryEntitled(): Promise<boolean> {
        return true
    },
}))

export type EventDestinationHooks = {
    isDeliveryEntitled(params: IsDeliveryEntitledParams): Promise<boolean>
}

export type IsDeliveryEntitledParams = {
    platformId: PlatformId
}
