
import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { WorkerJobType } from './job-data';

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