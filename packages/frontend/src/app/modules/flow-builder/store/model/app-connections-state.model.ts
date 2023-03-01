import { AppConnection } from '@activepieces/shared';

export interface AppConnectionsState {
  loaded: boolean;
  connections: AppConnection[];
}
