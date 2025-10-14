import { FastifyBaseLogger } from "fastify";
import { redisConnections } from "../../database/redis-connections";
import { FlowStatus } from "@activepieces/shared";

export const flowCache = (log: FastifyBaseLogger) => ({
    updateStatusCache: async ({ id, status }: UpdateParams): Promise<void> => {
        const redisConnection = await redisConnections.useExisting();
        await redisConnection.set(getRedisKey(id), status);
    },
    deleteStatusCache: async (id: string): Promise<void> => {
        const redisConnection = await redisConnections.useExisting();
        await redisConnection.del(getRedisKey(id));
    },
    updateManyStatusesCache: async (flows: UpdateParams[]): Promise<void> => {
        const redisConnection = await redisConnections.useExisting();
        const updateObject = flows.reduce((acc,flow) => ({ ...acc, [getRedisKey(flow.id)]: flow.status }), {})
        await redisConnection.mset(updateObject);
    },
    getStatusCache: async (flowId: string): Promise<FlowStatus | null> => {
        const redisConnection = await redisConnections.useExisting();
        const status = await redisConnection.get(getRedisKey(flowId));
        return status as FlowStatus | null
    }
})

const getRedisKey = (flowId: string) => `flow_status:${flowId}`

type UpdateParams = {
  id: string
  status: FlowStatus
}
