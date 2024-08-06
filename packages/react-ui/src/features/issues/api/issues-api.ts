import { api } from '@/lib/api';
import { SeekPage } from '@activepieces/shared';

export const issuesApi = {
  list(request: any): Promise<SeekPage<any>> {
    return api.get<SeekPage<any>>('/v1/issues', request);
  },
  resolve(issueId: string) {
    const body: any = {
      status: IssueStatus.RESOLEVED,
    };

    return api.post<void>(`/v1/issues/${issueId}`, body);
  },
  count() {
    return api.get<number>('/v1/issues/count');
  },
};
