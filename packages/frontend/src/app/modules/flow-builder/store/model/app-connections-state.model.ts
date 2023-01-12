import { AppConnection } from 'shared';

export interface AppConnectionsState {
	loaded: boolean;
	connections: AppConnection[];
}
