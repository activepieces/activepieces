import { Type } from '@sinclair/typebox';
import { t } from 'i18next';

import { formUtils } from '@/app/builder/piece-properties/form-utils';
import { authenticationSession } from '@/lib/authentication-session';
import {
  CustomAuthProperty,
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
  UpsertBasicAuthRequest,
  UpsertCloudOAuth2Request,
  UpsertCustomAuthRequest,
  UpsertOAuth2Request,
  UpsertPlatformOAuth2Request,
  UpsertSecretTextRequest,
  isNil,
  apId,
} from '@activepieces/shared';

export class ConnectionNameAlreadyExists extends Error {
  constructor() {
    super('Connection name already exists');
    this.name = 'ConnectionNameAlreadyExists';
  }
}

export const newConnectionUtils = {
  buildConnectionSchema(piece: PieceMetadataModelSummary | PieceMetadataModel) {
    const auth = piece.auth;
    if (isNil(auth)) {
      return Type.Object({
        request: Type.Composite([
          Type.Omit(UpsertAppConnectionRequestBody, ['externalId']),
        ]),
      });
    }
    const connectionSchema = Type.Object({
      externalId: Type.String({
        pattern: '^[A-Za-z0-9_\\-@\\+\\.]*$',
        minLength: 1,
        errorMessage: t(
          'Name can only contain letters, numbers and underscores',
        ),
      }),
    });

    switch (auth.type) {
      case PropertyType.SECRET_TEXT:
        return Type.Object({
          request: Type.Composite([
            Type.Omit(UpsertSecretTextRequest, ['externalId', 'displayName']),
            connectionSchema,
          ]),
        });
      case PropertyType.BASIC_AUTH:
        return Type.Object({
          request: Type.Composite([
            Type.Omit(UpsertBasicAuthRequest, ['externalId', 'displayName']),
            connectionSchema,
          ]),
        });
      case PropertyType.CUSTOM_AUTH:
        return Type.Object({
          request: Type.Composite([
            Type.Omit(UpsertCustomAuthRequest, [
              'externalId',
              'value',
              'displayName',
            ]),
            connectionSchema,
            Type.Object({
              value: Type.Object({
                props: formUtils.buildSchema(
                  (piece.auth as CustomAuthProperty<any>).props,
                ),
              }),
            }),
          ]),
        });
      case PropertyType.OAUTH2:
        return Type.Object({
          request: Type.Composite([
            Type.Omit(
              Type.Union([
                UpsertOAuth2Request,
                UpsertCloudOAuth2Request,
                UpsertPlatformOAuth2Request,
              ]),
              ['externalId', 'displayName'],
            ),
            connectionSchema,
          ]),
        });
      default:
        return Type.Object({
          request: Type.Composite([
            Type.Omit(UpsertAppConnectionRequestBody, [
              'externalId',
              'displayName',
            ]),
            connectionSchema,
          ]),
        });
    }
  },

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
