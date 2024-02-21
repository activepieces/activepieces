import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';

export interface AppConnectionsState {
  loaded: boolean;
  connections: AppConnectionWithoutSensitiveData[];
}
