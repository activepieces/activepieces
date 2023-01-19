import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { initFlowQueueConsumer } from "./flow-queue-consumer";

export const flowWorkerModule = async (_app: FastifyInstance, _options: FastifyPluginOptions): Promise<void> => {
  await initFlowQueueConsumer();
};
