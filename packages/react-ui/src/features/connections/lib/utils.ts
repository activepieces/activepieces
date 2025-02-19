import { t } from 'i18next';

import { authenticationSession } from '@/lib/authentication-session';
import {
  CustomAuthProps,
  OAuth2Props,
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  UpsertAppConnectionRequestBody,
  assertNotNullOrUndefined,
  isNil,
  apId,
} from '@activepieces/shared';

import { appConnectionsApi } from './app-connections-api';
import { globalConnectionsApi } from './global-connections-api';

export class ConnectionNameAlreadyExists extends Error {
  constructor() {
    super(t('Connection name already used'));
    this.name = 'ConnectionNameAlreadyExists';
  }
}

export class NoProjectSelected extends Error {
  constructor() {
    super(t('Please select at least one project'));
    this.name = 'NoProjectSelected';
  }
}

export const newConnectionUtils = {
  getConnectionName(
    piece: PieceMetadataModelSummary | PieceMetadataModel,
    reconnectConnection: AppConnectionWithoutSensitiveData | null,
    predefinedConnectionName: string | null,
  ): {
    externalId: string;
    displayName: string;
  } {
    if (reconnectConnection) {
      return {
        externalId: reconnectConnection.externalId,
        displayName: reconnectConnection.displayName,
      };
    }
    if (predefinedConnectionName) {
      return {
        externalId: predefinedConnectionName,
        displayName: piece.displayName,
      };
    }
    return {
      externalId: apId(),
      displayName: piece.displayName,
    };
  },

  createDefaultValues(
    piece: PieceMetadataModelSummary | PieceMetadataModel,
    suggestedExternalId: string,
    suggestedDisplayName: string,
  ): Partial<UpsertAppConnectionRequestBody> {
    const projectId = authenticationSession.getProjectId();
    assertNotNullOrUndefined(projectId, 'projectId');
    if (!piece.auth) {
      throw new Error(`Unsupported property type: ${piece.auth}`);
    }
    switch (piece.auth.type) {
      case PropertyType.SECRET_TEXT:
        return {
          externalId: suggestedExternalId,
          displayName: suggestedDisplayName,
          pieceName: piece.name,
          projectId,
          type: AppConnectionType.SECRET_TEXT,
          value: {
            type: AppConnectionType.SECRET_TEXT,
            secret_text: '',
          },
        };
      case PropertyType.BASIC_AUTH:
        return {
          externalId: suggestedExternalId,
          displayName: suggestedDisplayName,
          pieceName: piece.name,
          projectId,
          type: AppConnectionType.BASIC_AUTH,
          value: {
            type: AppConnectionType.BASIC_AUTH,
            username: '',
            password: '',
          },
        };
      case PropertyType.CUSTOM_AUTH: {
        return {
          externalId: suggestedExternalId,
          displayName: suggestedDisplayName,
          pieceName: piece.name,
          projectId,
          type: AppConnectionType.CUSTOM_AUTH,
          value: {
            type: AppConnectionType.CUSTOM_AUTH,
            props: newConnectionUtils.extractDefaultPropsValues(
              piece.auth.props,
            ),
          },
        };
      }
      case PropertyType.OAUTH2:
        return {
          externalId: suggestedExternalId,
          displayName: suggestedDisplayName,
          pieceName: piece.name,
          projectId,
          type: AppConnectionType.CLOUD_OAUTH2,
          value: {
            type: AppConnectionType.CLOUD_OAUTH2,
            scope: piece.auth.scope.join(' '),
            authorization_method: piece.auth?.authorizationMethod,
            client_id: '',
            props: newConnectionUtils.extractDefaultPropsValues(
              piece.auth.props,
            ),
            code: '',
          },
        };
      default:
        throw new Error(`Unsupported property type: ${piece.auth}`);
    }
  },

  extractDefaultPropsValues(props: CustomAuthProps | OAuth2Props | undefined) {
    if (!props) {
      return {};
    }
    return Object.entries(props).reduce((acc, [propName, prop]) => {
      if (prop.defaultValue) {
        return {
          ...acc,
          [propName]: prop.defaultValue,
        };
      }
      if (prop.type === PropertyType.CHECKBOX) {
        return {
          ...acc,
          [propName]: false,
        };
      }
      return acc;
    }, {});
  },
};

export const isConnectionNameUnique = async (
  isGlobalConnection: boolean,
  displayName: string,
) => {
  const connections = isGlobalConnection
    ? await globalConnectionsApi.list({
        limit: 10000,
      })
    : await appConnectionsApi.list({
        projectId: authenticationSession.getProjectId()!,
        limit: 10000,
      });
  const existingConnection = connections.data.find(
    (connection) => connection.displayName === displayName,
  );
  return isNil(existingConnection);
};
