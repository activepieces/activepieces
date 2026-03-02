import { api } from './api';

export type FlagsMap = Record<string, boolean | string | object | undefined>;
export const flagsApi = {
  getAll() {
    return api.get<FlagsMap>(`/v1/flags`);
  },
};
