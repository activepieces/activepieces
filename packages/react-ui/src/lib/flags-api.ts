import { ApFlagId } from '@activepieces/shared';

import { api } from './api';

export const flagsCacheKey = 'flags';
type FlagsMap = Record<string, boolean | string | object | undefined>;
export const flagsApi = {
  getAll() {
    return api.get<FlagsMap>(`/v1/flags`);
  },
  isFlagEnabled(flags: FlagsMap, flag: ApFlagId): boolean {
    return flags[flag] === true;
  },
};
