import { isNil } from '@activepieces/core-utils'
import { ResolveEventDestinationHeadersRequest, ResolveEventDestinationHeadersResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { eventDestinationService } from './event-destinations.service'

export const eventDestinationRpcHandlers = (log: FastifyBaseLogger) => ({
    async resolveEventDestinationHeaders({ platformId, destinationId }: ResolveEventDestinationHeadersRequest): Promise<ResolveEventDestinationHeadersResponse> {
        const headers = await eventDestinationService(log).resolveDeliveryHeaders({ platformId, destinationId })
        if (isNil(headers)) {
            return null
        }
        return { headers }
    },
})
