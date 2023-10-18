import { Action, createReducer, on } from '@ngrx/store';
import { BuilderActions } from '../builder/builder.action';
import { AppConnectionsState } from '../../model/app-connections-state';
import { appConnectionsActions } from './app-connections.action';

const initialState: AppConnectionsState = {
  loaded: false,
  connections: [],
};
const _appConnectionsReducer = createReducer(
  initialState,
  on(
    BuilderActions.loadInitial,
    (state, { appConnections }): AppConnectionsState => {
      return {
        loaded: true,
        connections: appConnections,
      };
    }
  ),
  on(
    appConnectionsActions.loadInitial,
    (state, { connections }): AppConnectionsState => {
      return {
        loaded: true,
        connections: connections,
      };
    }
  ),
  on(
    appConnectionsActions.upsert,
    (state, { connection }): AppConnectionsState => {
      const clonedConnections = [...state.connections];
      const upsertedConnection = clonedConnections.find(
        (c) => c.name === connection.name
      );
      if (!upsertedConnection) {
        return {
          loaded: true,
          connections: [...clonedConnections, connection],
        };
      } else {
        const upsertedConnectionIndex = clonedConnections.findIndex(
          (c) => c.name === connection.name
        );
        clonedConnections.splice(upsertedConnectionIndex, 1, connection);
        return {
          loaded: true,
          connections: clonedConnections,
        };
      }
    }
  )
);

export function appConnectionsReducer(
  state: AppConnectionsState | undefined,
  action: Action
) {
  return _appConnectionsReducer(state, action);
}
