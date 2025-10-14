import { FastifyBaseLogger } from "fastify";
import { redisConnections } from "../../database/redis-connections";
import { FlowStatus } from "@activepieces/shared";

export enum FlowCacheStatus {
    ENABLED = FlowStatus.ENABLED,
    DISABLED = FlowStatus.DISABLED,
    DELETED = "DELETED",
}

export const flowCache = (log: FastifyBaseLogger) => ({
    updateStatusCache: async ({ id, status }: UpdateParams): Promise<void> => {
        const redisConnection = await redisConnections.useExisting();
        await redisConnection.set(getRedisKey(id), status);
    },
    updateManyStatusesCache: async (flows: UpdateParams[]): Promise<void> => {
        const redisConnection = await redisConnections.useExisting();
        const updateObject = flows.map((flow) => ({
            [getRedisKey(flow.id)]: flow.status,
        }));
        await redisConnection.mset(updateObject);
    },
    getStatusCache: async (flowId: string): Promise<FlowCacheStatus | null> => {
        const redisConnection = await redisConnections.useExisting();
        const status = await redisConnection.get(getRedisKey(flowId));
        return status as FlowCacheStatus | null
    }
})

const getRedisKey = (flowId: string) => `flow_status:${flowId}`

type UpdateParams = {
  id: string
  status: FlowCacheStatus | FlowStatus
}
