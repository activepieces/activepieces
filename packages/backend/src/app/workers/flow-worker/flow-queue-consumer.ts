import { Worker } from "bullmq";
import { ApId, RunEnvironment, TriggerType } from "shared";
import { collectionService } from "../../collections/collection.service";
import { createRedisClient } from "../../database/redis-connection";
import { flowRunService } from "../../flow-run/flow-run-service";
import { flowVersionService } from "../../flows/flow-version/flow-version.service";
import { triggerUtils } from "../../helper/trigger-utils";
import { ONE_TIME_JOB_QUEUE, REPEATABLE_JOB_QUEUE } from "./flow-queue";
import { flowWorker } from "./flow-worker";
import { OneTimeJobData, RepeatableJobData } from "./job-data";

const oneTimeJobConsumer = new Worker<OneTimeJobData, unknown, ApId>(
  ONE_TIME_JOB_QUEUE,
  async (job) => {
    console.info(`[oneTimeJobConsumer] job.id=${job.name}`);
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
    console.info(`[repeatableJobConsumer] job.id=${job.name}`);
    const { data } = job;
    switch (data.triggerType) {
      case TriggerType.SCHEDULE:
        await consumeScheduleTrigger(data);
        break;
      case TriggerType.PIECE:
        await consumePieceTrigger(data);
        break;
    }
  },
  {
    connection: createRedisClient(),
  }
);

const consumeScheduleTrigger = async (data: RepeatableJobData): Promise<void> => {
  await flowRunService.start({
    environment: data.environment,
    flowVersionId: data.flowVersion.id,
    collectionVersionId: data.collectionVersionId,
    payload: null,
  });
};

const consumePieceTrigger = async (data: RepeatableJobData): Promise<void> => {
  const payloads: unknown[] = await triggerUtils.executeTrigger({
    collectionId: data.collectionId,
    flowVersion: data.flowVersion,
    payload: null,
  });

  console.info(`[flowQueueConsumer#consumePieceTrigger] payloads.length=${payloads.length}`);

  const createFlowRuns = payloads.map((payload) => 
    flowRunService.start({
      environment: RunEnvironment.PRODUCTION,
      collectionVersionId: data.collectionVersionId,
      flowVersionId: data.flowVersion.id,
      payload,
    })
  );

  await Promise.all(createFlowRuns);
};

export const initFlowQueueConsumer = async (): Promise<void> => {
  const startWorkers = [oneTimeJobConsumer.waitUntilReady(), repeatableJobConsumer.waitUntilReady()];
  await Promise.all(startWorkers);
};
