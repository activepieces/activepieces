import { PlatformId } from '@activepieces/core-utils'
import { hooksFactory } from '../helper/hooks-factory'

export const eventDestinationHooks = hooksFactory.create<EventDestinationHooks>(() => ({
    async doesPlatformHaveEventStreamingEnabled(): Promise<boolean> {
        return true
    },
    async fetchPlatformIdsWithEventStreamingEnabled({ platformIds }: FetchPlatformIdsWithEventStreamingEnabledParams): Promise<PlatformId[]> {
        return platformIds
    },
}))

export type EventDestinationHooks = {
    doesPlatformHaveEventStreamingEnabled(params: DoesPlatformHaveEventStreamingEnabledParams): Promise<boolean>
    fetchPlatformIdsWithEventStreamingEnabled(params: FetchPlatformIdsWithEventStreamingEnabledParams): Promise<PlatformId[]>
}

export type DoesPlatformHaveEventStreamingEnabledParams = {
    platformId: PlatformId
}

export type FetchPlatformIdsWithEventStreamingEnabledParams = {
    platformIds: PlatformId[]
}
