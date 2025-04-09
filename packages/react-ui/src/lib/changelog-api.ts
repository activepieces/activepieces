import { Changelog } from '@activepieces/shared';

import { api } from './api';
export const changelogApi = {
  getChangelogs(): Promise<Changelog> {
    return api.get<Changelog>('/v1/changelogs');
  },
};
