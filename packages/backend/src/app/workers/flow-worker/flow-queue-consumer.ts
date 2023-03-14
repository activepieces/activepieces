import { Worker } from "bullmq";
import { ActivepiecesError, ApId, ErrorCode, RunEnvironment, TriggerType } from "@activepieces/shared";
import { createRedisClient } from "../../database/redis-connection";
import { flowRunService } from "../../flow-run/flow-run-service";
import { triggerUtils } from "../../helper/trigger-utils";
import { ONE_TIME_JOB_QUEUE, REPEATABLE_JOB_QUEUE } from "./flow-queue";
import { flowWorker } from "./flow-worker";
import { OneTimeJobData, RepeatableJobData } from "./job-data";
import { logger } from "../../helper/logger";
import { system } from "../../helper/system/system";
import { SystemProp } from "../../helper/system/system-prop";
import { instanceService } from "../../instance/instance.service";

const oneTimeJobConsumer = new Worker<OneTimeJobData, unknown, ApId>(
    ONE_TIME_JOB_QUEUE,
    async (job) => {
        logger.info(`[oneTimeJobConsumer] job.id=${job.name}`);
        const data = job.data;
        return await flowWorker.executeFlow(data);
    },
    {
        connection: createRedisClient(),
        concurrency: system.getNumber(SystemProp.FLOW_WORKER_CONCURRENCY) ?? 10,
    },
);

const repeatableJobConsumer = new Worker<RepeatableJobData, unknown, ApId>(
    REPEATABLE_JOB_QUEUE,
    async (job) => {

        logger.info(`[repeatableJobConsumer] job.id=${job.name} job.type=${job.data.triggerType}`);
        const { data } = job;

        try {
            switch (data.triggerType) {
            case TriggerType.SCHEDULE:
                await consumeScheduleTrigger(data);
                break;
            case TriggerType.PIECE:
                await consumePieceTrigger(data);
                break;
            }
        }
        catch (e) {
            if (e instanceof ActivepiecesError) {
                const apError: ActivepiecesError = e as ActivepiecesError;
                const instance = await instanceService.getByCollectionId({ projectId: data.projectId, collectionId: data.collectionId });
                if (apError.error.code === ErrorCode.TASK_QUOTA_EXCEEDED) {
                    logger.info(`[repeatableJobConsumer] removing job.id=${job.name} run out of flow quota`);
                    await instanceService.deleteOne({ projectId: data.projectId, id: instance.id })
                }
            }
            else {
                throw e;
            }
        }
        logger.info(`[repeatableJobConsumer] done job.id=${job.name} job.type=${job.data.triggerType}`);
    },
    {
        connection: createRedisClient(),
    }
);

const consumeScheduleTrigger = async (data: RepeatableJobData): Promise<void> => {
    await flowRunService.start({
        environment: data.environment,
        flowVersionId: data.flowVersion.id,
        collectionId: data.collectionId,
        payload: null,
    });
};

const consumePieceTrigger = async (data: RepeatableJobData): Promise<void> => {
    const payloads: unknown[] = await triggerUtils.executeTrigger({
        projectId: data.projectId,
        collectionId: data.collectionId,
        flowVersion: data.flowVersion,
        payload: null,
    });

    logger.info(`[flowQueueConsumer#consumePieceTrigger] payloads.length=${payloads.length}`);

    const createFlowRuns = payloads.map((payload) =>
        flowRunService.start({
            environment: RunEnvironment.PRODUCTION,
            collectionId: data.collectionId,
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
