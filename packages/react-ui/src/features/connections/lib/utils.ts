import { t } from 'i18next';
import { CheckIcon, UnplugIcon, XIcon } from 'lucide-react';

import { formUtils } from '@/features/pieces/lib/form-utils';
import { authenticationSession } from '@/lib/authentication-session';
import { OAuth2App } from '@/lib/oauth2-utils';
import {
  CustomAuthProps,
  OAuth2Props,
  PieceAuthProperty,
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
  AppConnectionStatus,
  OAuth2GrantType,
} from '@activepieces/shared';

import { appConnectionsApi } from './api/app-connections';
import { globalConnectionsApi } from './api/global-connections';

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

export const appConnectionUtils = {
  getStatusIcon(status: AppConnectionStatus): {
    variant: 'default' | 'success' | 'error';
    icon: React.ComponentType;
  } {
    switch (status) {
      case AppConnectionStatus.ACTIVE:
        return {
          variant: 'success',
          icon: CheckIcon,
        };
      case AppConnectionStatus.MISSING:
        return {
          variant: 'default',
          icon: UnplugIcon,
        };
      case AppConnectionStatus.ERROR:
        return {
          variant: 'error',
          icon: XIcon,
        };
    }
  },
};

export const newConnectionUtils = {
  getConnectionName(
    piece: PieceMetadataModelSummary | PieceMetadataModel,
    reconnectConnection: AppConnectionWithoutSensitiveData | null,
    externalIdComingFromSdk?: string | null,
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
    if (externalIdComingFromSdk) {
      return {
        externalId: externalIdComingFromSdk,
        displayName: externalIdComingFromSdk,
      };
    }

    return {
      externalId: apId(),
      displayName: piece.displayName,
    };
  },

  createDefaultValues({
    auth,
    suggestedExternalId,
    suggestedDisplayName,
    pieceName,
    grantType,
    oauth2App,
    redirectUrl,
  }: DefaultValuesParams): Partial<UpsertAppConnectionRequestBody> {
    const projectId = authenticationSession.getProjectId();
    assertNotNullOrUndefined(projectId, 'projectId');
    if (!auth) {
      throw new Error(`Unsupported property type: ${auth}`);
    }
    const commmonProps = {
      externalId: suggestedExternalId,
      displayName: suggestedDisplayName,
      pieceName: pieceName,
      projectId,
    };

    switch (auth.type) {
      case PropertyType.SECRET_TEXT:
        return {
          ...commmonProps,
          type: AppConnectionType.SECRET_TEXT,
          value: {
            type: AppConnectionType.SECRET_TEXT,
            secret_text: '',
          },
        };
      case PropertyType.BASIC_AUTH:
        return {
          ...commmonProps,
          type: AppConnectionType.BASIC_AUTH,
          value: {
            type: AppConnectionType.BASIC_AUTH,
            username: '',
            password: '',
          },
        };
      case PropertyType.CUSTOM_AUTH: {
        return {
          ...commmonProps,
          type: AppConnectionType.CUSTOM_AUTH,
          value: {
            type: AppConnectionType.CUSTOM_AUTH,
            props: formUtils.getDefaultValueForProperties({
              props: auth.props ?? {},
              existingInput: {},
            }),
          },
        };
      }
      case PropertyType.OAUTH2: {
        switch (oauth2App?.oauth2Type) {
          case AppConnectionType.CLOUD_OAUTH2:
            return {
              ...commmonProps,
              type: AppConnectionType.CLOUD_OAUTH2,
              value: {
                type: AppConnectionType.CLOUD_OAUTH2,
                client_id: oauth2App.clientId,
                code: '',
                scope: auth.scope.join(' '),
                authorization_method: auth.authorizationMethod,
                props: formUtils.getDefaultValueForProperties({
                  props: auth.props ?? {},
                  existingInput: {},
                }),
              },
            };
          case AppConnectionType.PLATFORM_OAUTH2:
            return {
              ...commmonProps,
              type: AppConnectionType.PLATFORM_OAUTH2,
              value: {
                type: AppConnectionType.PLATFORM_OAUTH2,
                client_id: oauth2App.clientId,
                redirect_url: redirectUrl,
                code: '',
                scope: auth.scope.join(' '),
                authorization_method: auth.authorizationMethod,
                props: formUtils.getDefaultValueForProperties({
                  props: auth.props ?? {},
                  existingInput: {},
                }),
              },
            };
          default:
            return {
              ...commmonProps,
              type: AppConnectionType.OAUTH2,
              value: {
                type: AppConnectionType.OAUTH2,
                client_id: '',
                redirect_url: redirectUrl,
                code: '',
                scope: auth.scope.join(' '),
                authorization_method: auth.authorizationMethod,
                props: formUtils.getDefaultValueForProperties({
                  props: auth.props ?? {},
                  existingInput: {},
                }),
                client_secret: '',
                grant_type: grantType ?? OAuth2GrantType.AUTHORIZATION_CODE,
              },
            };
        }
      }
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

type DefaultValuesParams = {
  suggestedExternalId: string;
  suggestedDisplayName: string;
  pieceName: string;
  redirectUrl: string;
  auth: PieceAuthProperty;
  oauth2App: OAuth2App | null;
  grantType: OAuth2GrantType | null;
};
