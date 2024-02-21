import { createSelector } from '@ngrx/store';
import { selectCommonState } from '../common.selector';
import { CommonStateModel } from '../common-state.model';
import { AppConnectionsState } from './app-connections-state.model';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { ConnectionDropdownItem } from './connections-dropdown-item';
import { MentionListItem } from './mention-list-item';

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

const selectAppConnectionsDropdownOptionsWithIds = createSelector(
  selectAllAppConnections,
  (connections: AppConnectionWithoutSensitiveData[]) => {
    return [...connections].map((c) => {
      const result: ConnectionDropdownItem = {
        label: { pieceName: c.pieceName, name: c.name },
        value: c.id,
      };
      return result;
    });
  }
);

const selectAppConnectionsDropdownOptionsForAppWithIds = (appName: string) => {
  return createSelector(
    selectAppConnectionsDropdownOptionsWithIds,
    (connections) => {
      return connections
        .filter((opt) => opt.label.pieceName === appName)
        .map((c) => {
          const result: ConnectionDropdownItem = {
            label: { pieceName: c.label.pieceName, name: c.label.name },
            value: c.value,
          };
          return result;
        });
    }
  );
};
const selectAppConnectionsForMentionsDropdown = createSelector(
  selectAllAppConnections,
  (connections: AppConnectionWithoutSensitiveData[]) => {
    return [...connections].map((c) => {
      const result: MentionListItem = {
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
  selectAppConnectionsDropdownOptionsWithIds,
  selectAppConnectionsDropdownOptionsForAppWithIds,
  selectAppConnectionsForMentionsDropdown,
};
