import { Queue } from "bullmq";
import { ApId } from "shared";
import { redisConnection } from "../../database/redis-connection";
import { ActivepiecesError, ErrorCode } from "../../helper/activepieces-error";
import { JobData } from "./job-data";

interface AddParams {
  id: ApId;
  data: JobData;
  cronExpression?: string | undefined;
}

interface RemoveParams {
  id: ApId;
  repeatable: boolean;
}

const JOB_REMOVAL_FAILURE = 0;

const oneTimeJobQueue = new Queue<JobData, unknown, ApId>("oneTimeJobs", { connection: redisConnection });
const repeatableJobQueue = new Queue<JobData, unknown, ApId>("repeatableJobs", { connection: redisConnection });

export const flowQueue = {
  async add({ id, data, cronExpression }: AddParams): Promise<void> {
    if (cronExpression === undefined) {
      await oneTimeJobQueue.add(id, data, {
        jobId: id,
      });
    } else {
      await repeatableJobQueue.add(id, data, {
        jobId: id,
        repeat: {
          pattern: cronExpression,
        },
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
