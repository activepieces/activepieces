import { GitlabAuthValue, gitlabRequest, projectPath } from './client';
import { GitlabApiError } from './secret-request';

export async function resetIssueSpentTime<T>({
  auth,
  projectId,
  issueIid,
}: {
  auth: GitlabAuthValue;
  projectId: string | number;
  issueIid: number;
}): Promise<T> {
  return gitlabRequest<T>({
    auth,
    method: 'POST',
    path: `${projectPath(projectId)}/issues/${issueIid}/reset_spent_time`,
  });
}

export async function mergeMergeRequest<T>({
  auth,
  projectId,
  mergeRequestIid,
  body,
  statusMessages,
}: {
  auth: GitlabAuthValue;
  projectId: string | number;
  mergeRequestIid: number;
  body: Record<string, unknown>;
  statusMessages: Partial<Record<number, string>>;
}): Promise<T> {
  return gitlabRequest<T>({
    auth,
    method: 'PUT',
    path: `${projectPath(projectId)}/merge_requests/${mergeRequestIid}/merge`,
    body,
    statusMessages,
  });
}

export async function cancelJob<T>({ auth, projectId, jobId }: { auth: GitlabAuthValue; projectId: string | number; jobId: number }): Promise<T> {
  return gitlabRequest<T>({ auth, method: 'POST', path: `${projectPath(projectId)}/jobs/${jobId}/cancel` });
}

export async function cancelPipeline<T>({ auth, projectId, pipelineId }: { auth: GitlabAuthValue; projectId: string | number; pipelineId: number }): Promise<T> {
  return gitlabRequest<T>({ auth, method: 'POST', path: `${projectPath(projectId)}/pipelines/${pipelineId}/cancel` });
}

export async function eraseJob<T>({ auth, projectId, jobId }: { auth: GitlabAuthValue; projectId: string | number; jobId: number }): Promise<T> {
  return gitlabRequest<T>({
    auth,
    method: 'POST',
    path: `${projectPath(projectId)}/jobs/${jobId}/erase`,
    statusMessages: { 403: 'GitLab refused to erase the job (it may still be running, already erased, or the connected user lacks permission)' },
  });
}

export async function archiveProject<T>({ auth, projectId }: { auth: GitlabAuthValue; projectId: string | number }): Promise<T> {
  const path = projectPath(projectId);
  try {
    return await gitlabRequest<T>({ auth, method: 'POST', path: `${path}/archive` });
  } catch (error) {
    if (error instanceof GitlabApiError && error.status === 400 && /already archived/i.test(error.message)) {
      return gitlabRequest<T>({ auth, method: 'GET', path });
    }
    throw error;
  }
}
