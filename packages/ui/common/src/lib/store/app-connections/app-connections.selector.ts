import { createSelector } from '@ngrx/store';
import { selectCommonState } from '../common.selector';
import { CommonStateModel } from '../common-state.model';
import { AppConnectionsState } from './app-connections-state.model';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { PieceConnectionDropdownItem } from './connections-dropdown-item';

const selectConnectionsState = createSelector(
  selectCommonState,
  (state: CommonStateModel): AppConnectionsState => state.appConnectionsState
);

const selectAllAppConnections = createSelector(
  selectConnectionsState,
  (appConnectionsState) => appConnectionsState.connections
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
  selectAllConnectionsForPiece,
};
