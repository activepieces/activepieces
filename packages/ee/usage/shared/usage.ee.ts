import { ProjectId } from "@activepieces/shared";

export interface ProjectUsage  {
  projectId: ProjectId;
  metrics: {
    steps: {
      consumed: number,
      remaining: number,
      nextResetInMs: number
    };
  }
}
