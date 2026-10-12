import { GitlabAuthValue, gitlabRequest, projectPath } from './client';

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
