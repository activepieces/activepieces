import {
  DismissChangelogRequest,
  ListChangelogsResponse,
} from '@activepieces/shared';

import { api } from './api';

export const changelogApi = {
  list(): Promise<ListChangelogsResponse> {
    return api.get<ListChangelogsResponse>('/v1/changelogs');
  },
  dismiss(request: DismissChangelogRequest): Promise<void> {
    return api.post<void>('/v1/changelogs/dismiss', request);
  },
};
