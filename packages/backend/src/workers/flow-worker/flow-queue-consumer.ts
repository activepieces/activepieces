import { Worker } from "bullmq";
import { ApId } from "shared";
import Redis from "ioredis";
import { createRedisClient, redisConnection } from "../../database/redis-connection";
import { flowRunService } from "../../flow-run/flow-run-service";
import { ONE_TIME_JOB_QUEUE, REPEATABLE_JOB_QUEUE } from "./flow-queue";
import { flowWorker } from "./flow-worker";
import { OneTimeJobData, RepeatableJobData } from "./job-data";

const oneTimeJobConsumer = new Worker<OneTimeJobData, unknown, ApId>(
  ONE_TIME_JOB_QUEUE,
  async (job) => {
    console.log(`\n[oneTimeJobConsumer] job.id=${job.name}\n`);
    const data = job.data;
    return await flowWorker.executeFlow(data);
  },
  {
    connection: createRedisClient(),
  }
);

const repeatableJobConsumer = new Worker<RepeatableJobData, unknown, ApId>(
  REPEATABLE_JOB_QUEUE,
  async (job) => {
    console.log(`\n[repeatableJobConsumer] job.id=${job.name}\n`);
    const { data } = job;
    return await flowRunService.start({
      instanceId: data.instanceId,
      flowVersionId: data.flowVersionId,
      collectionVersionId: data.collectionVersionId,
      payload: null,
    });
  },
  {
    connection: createRedisClient(),
  }
);

export const initFlowQueueConsumer = async (): Promise<void> => {
  const startWorkers = [oneTimeJobConsumer.waitUntilReady(), repeatableJobConsumer.waitUntilReady()];
  await Promise.all(startWorkers);
};
