import { createSelector } from '@ngrx/store';
import { selectCommonState } from '../common.selector';
import { CommonStateModel } from '../common-state.model';
import { AppConnectionsState } from './app-connections-state.model';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import {
  ConnectionDropdownItem,
  PieceConnectionDropdownItem,
} from './connections-dropdown-item';

const selectConnectionsState = createSelector(
  selectCommonState,
  (state: CommonStateModel): AppConnectionsState => state.appConnectionsState
);

const selectAllAppConnections = createSelector(
  selectConnectionsState,
  (appConnectionsState) => appConnectionsState.connections
);

export const selectConnection = (connectionName: string) =>
  createSelector(
    selectAllAppConnections,
    (connections: AppConnectionWithoutSensitiveData[]) => {
      return connections.find((c) => c.name === connectionName);
    }
  );

const selectAppConnectionsDropdownOptions = createSelector(
  selectAllAppConnections,
  (connections: AppConnectionWithoutSensitiveData[]) => {
    return [...connections].map((c) => {
      const result: ConnectionDropdownItem = {
        label: { pieceName: c.pieceName, name: c.name },
        value: `{{connections['${c.name}']}}`,
      };
      return result;
    });
  }
);

const selectAllConnectionsForPiece = (pieceName: string) =>
  createSelector(
    selectAllAppConnections,
    (connections: AppConnectionWithoutSensitiveData[]) => {
      return [...connections]
        .filter((c) => c.pieceName === pieceName)
        .map((c) => {
          const result: PieceConnectionDropdownItem = {
            label: c.name,
            value: `{{connections['${c.name}']}}`,
          };
          return result;
        });
    }
  );

export const appConnectionsSelectors = {
  selectAllAppConnections,
  selectConnection,
  selectAppConnectionsDropdownOptions,
  selectAllConnectionsForPiece,
};
