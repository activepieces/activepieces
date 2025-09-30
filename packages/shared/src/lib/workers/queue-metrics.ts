import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { WorkerJobType } from './job-data';

export enum WorkerJobStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DELAYED = 'DELAYED',
  ACTIVE = 'ACTIVE',
  QUEUED = 'QUEUED',
  // RETRYING = 'RETRYING',
  // THROTTLED = 'THROTTLED',
}

export const ListQueueJobsRequestQuery = Type.Object({
  page: Type.Integer(),
  limit: Type.Optional(Type.Integer()),
  jobType: Type.Optional(Type.Enum(WorkerJobType)),
  status: Type.Optional(Type.String()),
})

export type ListQueueJobsRequestQuery = Static<typeof ListQueueJobsRequestQuery>


export const WorkerJobStats = Type.Object({
    active: Type.Number(),
    failed: Type.Number(),
    retried: Type.Number(),
    delayed: Type.Number(),
    throttled: Type.Number(),
})

export type WorkerJobStats = Static<typeof WorkerJobStats>

export const WorkerJobStatItem = Type.Object({
    jobType: Type.Enum(WorkerJobType),
    stats: WorkerJobStats,
  });

export type WorkerJobStatItem = Static<typeof WorkerJobStatItem>;

export const WorkerJobLog = Type.Object({
    ...BaseModelSchema,
    jobType: Type.String(),
    status: Type.String(),
    data: Type.Any(),
  })

export type WorkerJobLog = Static<typeof WorkerJobLog> 