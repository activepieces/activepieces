import { ApFlagId } from '@activepieces/shared';

import { api } from '../../../lib/api';

export const flagsCacheKey = 'flags';
type FlagsMap = Record<string, boolean | string | object | undefined>;
export const flagsApi = {
  getFlags() {
    return api.get<FlagsMap>(`/v1/flags`);
  },
  isFlagEnabled(flags: FlagsMap, flag: ApFlagId): boolean {
    return flags[flag] === true;
  },
};
