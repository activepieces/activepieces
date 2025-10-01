import { Static, Type } from '@sinclair/typebox'
import { WorkerJobType } from './job-data';

export enum WorkerJobStatus {
  FAILED = 'FAILED',
  DELAYED = 'DELAYED',
  ACTIVE = 'ACTIVE',
  QUEUED = 'QUEUED',
  RETRYING = 'RETRYING',
  THROTTLED = 'THROTTLED',
}

export const ListQueueJobsRequestQuery = Type.Object({
  page: Type.Integer(),
  limit: Type.Optional(Type.Integer()),
  jobType: Type.Optional(Type.Enum(WorkerJobType)),
  status: Type.Optional(Type.String()),
})

export type ListQueueJobsRequestQuery = Static<typeof ListQueueJobsRequestQuery>

export const WorkerJobStats = Type.Object({
    [WorkerJobStatus.ACTIVE]: Type.Number(),
    [WorkerJobStatus.QUEUED]: Type.Number(),
    [WorkerJobStatus.FAILED]: Type.Number(),
    [WorkerJobStatus.RETRYING]: Type.Number(),
    [WorkerJobStatus.DELAYED]: Type.Number(),
    [WorkerJobStatus.THROTTLED]: Type.Number(),
})

export type WorkerJobStats = Static<typeof WorkerJobStats>

export const WorkerJobStatItem = Type.Object({
    jobType: Type.Enum(WorkerJobType),
    stats: WorkerJobStats,
  });

export type WorkerJobStatItem = Static<typeof WorkerJobStatItem>;

