import { Queue } from 'bullmq';
import {ApId, FlowVersionId} from 'shared';
import { redisConnection } from '../../database/redis-connection';
import { ActivepiecesError, ErrorCode } from '../../helper/activepieces-error';

type JobData = {
    flowVersionId: FlowVersionId,
};

type JobResultType = {};

type AddParams = {
    id: ApId,
    data: JobData,
    cronExpression?: string | undefined,
};

type RemoveParams = {
    id: ApId,
};

const JOB_REMOVAL_FAILURE = 0;

const jobQueue = new Queue<JobData, JobResultType, ApId>('jobs', { connection: redisConnection });

export const flowQueue = {
    async add({ id, data, cronExpression }: AddParams): Promise<void> {
        await jobQueue.add(
            id,
            data,
            {
                jobId: id,
                repeat: {
                    pattern: cronExpression,
                }
            },
        );
    },

    async remove({ id }: RemoveParams): Promise<void> {
        const result = await jobQueue.remove(id);

        if (result === JOB_REMOVAL_FAILURE) {
            throw new ActivepiecesError({
                code: ErrorCode.JOB_REMOVAL_FAILURE,
                params: {
                    jobId: id,
                },
            });
        }
    }
}
