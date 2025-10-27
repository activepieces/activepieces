import { ProjectId } from '@activepieces/shared'

export const getProjectMaxConcurrentJobsKey = (projectId: ProjectId): string => `project:max-concurrent-jobs:${projectId}`