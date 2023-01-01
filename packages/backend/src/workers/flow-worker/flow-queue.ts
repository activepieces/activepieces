import { Queue } from "bullmq";
import Redis from "ioredis";
import { ApId } from "shared";
import { redisConnection } from "../../database/redis-connection";
import { ActivepiecesError, ErrorCode } from "../../helper/activepieces-error";
import { OneTimeJobData, RepeatableJobData } from "./job-data";

interface BaseAddParams {
  id: ApId;
}

interface RepeatableJobAddParams extends BaseAddParams {
  data: RepeatableJobData;
  cronExpression: string;
}

interface OneTimeJobAddParams extends BaseAddParams {
  data: OneTimeJobData;
}

type AddParams = OneTimeJobAddParams | RepeatableJobAddParams;

interface RemoveParams {
  id: ApId;
  repeatable: boolean;
}

const JOB_REMOVAL_FAILURE = 0;

export const ONE_TIME_JOB_QUEUE = "oneTimeJobs";
export const REPEATABLE_JOB_QUEUE = "repeatableJobs";

const oneTimeJobQueue = new Queue<OneTimeJobData, unknown, ApId>(ONE_TIME_JOB_QUEUE, {
  connection: new Redis(6379, {
    maxRetriesPerRequest: null,
  }),
});

const repeatableJobQueue = new Queue<RepeatableJobData, unknown, ApId>(REPEATABLE_JOB_QUEUE, {
  connection: new Redis(6379, {
    maxRetriesPerRequest: null,
  }),
});

export const flowQueue = {
  async add(params: AddParams): Promise<void> {
    console.log("[flowQueue#add] params=", params);
    if (isRepeatable(params)) {
      const { id, data, cronExpression } = params;

      await repeatableJobQueue.add(id, data, {
        jobId: id,
        repeat: {
          pattern: cronExpression,
        },
      });
    } else {
      const { id, data } = params;

      await oneTimeJobQueue.add(id, data, {
        jobId: id,
      });
    }
  },

  async remove({ id, repeatable }: RemoveParams): Promise<void> {
    const queue = repeatable ? repeatableJobQueue : oneTimeJobQueue;

    const result = await queue.remove(id);

    if (result === JOB_REMOVAL_FAILURE) {
      throw new ActivepiecesError({
        code: ErrorCode.JOB_REMOVAL_FAILURE,
        params: {
          jobId: id,
        },
      });
    }
  },
};

const isRepeatable = (params: AddParams): params is RepeatableJobAddParams => {
  return (params as RepeatableJobAddParams).cronExpression !== undefined;
};
