import { api } from '@/lib/api';
import {
  IssueStatus,
  ListIssuesParams,
  PopulatedIssue,
  UpdateIssueRequestBody,
  SeekPage,
} from '@activepieces/shared';

export const issuesApi = {
  list(request: ListIssuesParams): Promise<SeekPage<PopulatedIssue>> {
    return api.get<SeekPage<PopulatedIssue>>('/v1/issues', request);
  },
  archive(issueId: string) {
    const body: UpdateIssueRequestBody = {
      status: IssueStatus.ARCHIVED,
    };

    return api.post<void>(`/v1/issues/${issueId}`, body);
  },
  count() {
    return api.get<number>('/v1/issues/count');
  },
};
