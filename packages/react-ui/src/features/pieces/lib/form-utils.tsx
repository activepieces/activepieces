import { TSchema, Type } from '@sinclair/typebox';
import { t } from 'i18next';

import {
  piecePropertiesUtils,
  OAuth2Props,
  PieceAuthProperty,
  PieceMetadata,
  PieceMetadataModel,
  PieceProperty,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  CodeActionSchema,
  LoopOnItemsActionSchema,
  PieceActionSchema,
  PieceActionSettings,
  PieceTrigger,
  isNil,
  RouterActionSchema,
  RouterBranchesSchema,
  SampleDataSetting,
  RouterExecutionType,
  UpsertOAuth2Request,
  UpsertCloudOAuth2Request,
  UpsertPlatformOAuth2Request,
  UpsertAppConnectionRequestBody,
  UpsertCustomAuthRequest,
  UpsertBasicAuthRequest,
  UpsertSecretTextRequest,
  FlowTriggerType,
  FlowActionType,
  FlowAction,
  FlowTrigger,
  PropertyExecutionType,
  PropertySettings,
  PieceTriggerSettings,
} from '@activepieces/shared';

function buildInputSchemaForStep(
  type: FlowActionType | FlowTriggerType,
  piece: PieceMetadata | null,
  actionNameOrTriggerName: string,
): TSchema {
  switch (type) {
    case FlowActionType.PIECE: {
      if (
        piece &&
        actionNameOrTriggerName &&
        piece.actions[actionNameOrTriggerName]
      ) {
        return piecePropertiesUtils.buildSchema(
          piece.actions[actionNameOrTriggerName].props,
          piece.auth,
          piece.actions[actionNameOrTriggerName].requireAuth,
        );
      }
      return Type.Object({});
    }
    case FlowTriggerType.PIECE: {
      if (
        piece &&
        actionNameOrTriggerName &&
        piece.triggers[actionNameOrTriggerName]
      ) {
        return piecePropertiesUtils.buildSchema(
          piece.triggers[actionNameOrTriggerName].props,
          piece.auth,
          piece.triggers[actionNameOrTriggerName].requireAuth,
        );
      }
      return Type.Object({});
    }
    default:
      throw new Error('Unsupported type: ' + type);
  }
}

function getDefaultPropertyValue({
  property,
  dynamicInputModeToggled,
}: {
  property: PieceProperty;
  dynamicInputModeToggled: boolean;
}) {
  switch (property.type) {
    case PropertyType.ARRAY: {
      const isInlinedItemMode = dynamicInputModeToggled && property.properties;
      if (isInlinedItemMode) {
        return {};
      } else if (dynamicInputModeToggled) {
        return '';
      }
      return property.defaultValue ?? [];
    }
    case PropertyType.OBJECT:
    case PropertyType.JSON: {
      if (dynamicInputModeToggled) {
        return '';
      }
      return property.defaultValue ?? {};
    }
    case PropertyType.SHORT_TEXT:
    case PropertyType.LONG_TEXT:
    case PropertyType.MARKDOWN:
    case PropertyType.FILE:
    case PropertyType.DATE_TIME:
    case PropertyType.NUMBER: {
      return property.defaultValue ?? '';
    }
    case PropertyType.DYNAMIC: {
      return {};
    }
    case PropertyType.CHECKBOX: {
      if (dynamicInputModeToggled) {
        return '';
      }
      return property.defaultValue ?? false;
    }
    case PropertyType.DROPDOWN:
    case PropertyType.STATIC_DROPDOWN:
    case PropertyType.MULTI_SELECT_DROPDOWN:
    case PropertyType.STATIC_MULTI_SELECT_DROPDOWN: {
      if (dynamicInputModeToggled) {
        return '';
      }
      if (
        property.type === PropertyType.MULTI_SELECT_DROPDOWN ||
        property.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN
      ) {
        return property.defaultValue ?? [];
      }
      return property.defaultValue ?? null;
    }
    case PropertyType.COLOR: {
      if (dynamicInputModeToggled) {
        return '';
      }
      return property.defaultValue ?? '';
    }
    case PropertyType.OAUTH2:
    case PropertyType.CUSTOM_AUTH:
    case PropertyType.BASIC_AUTH:
    case PropertyType.SECRET_TEXT:
    case PropertyType.CUSTOM: {
      return '';
    }
  }
}

function getDefaultValueForProperties({
  props,
  existingInput,
  propertySettings,
}: {
  props: PiecePropertyMap | OAuth2Props;
  existingInput: Record<string, unknown>;
  propertySettings?: Record<string, PropertySettings>;
}): Record<string, unknown> {
  return Object.entries(props).reduce<Record<string, unknown>>(
    (defaultValues, [propertyName, property]) => {
      defaultValues[propertyName] =
        //we specifically check for undefined because null is a valid value
        existingInput[propertyName] === undefined
          ? getDefaultPropertyValue({
              property,
              dynamicInputModeToggled:
                propertySettings?.[propertyName]?.type ===
                PropertyExecutionType.DYNAMIC,
            })
          : existingInput[propertyName];
      return defaultValues;
    },
    {},
  );
}

function buildConnectionSchema(auth: PieceAuthProperty) {
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
      errorMessage: t('Name can only contain letters, numbers and underscores'),
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
              props: piecePropertiesUtils.buildSchema(auth.props, undefined),
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
            ['externalId', 'displayName', 'value'],
          ),
          Type.Object({
            //props in the request schema is any object, so we need to build a schema for it
            value: Type.Composite([
              Type.Omit(
                Type.Union([
                  UpsertOAuth2Request.properties.value,
                  UpsertCloudOAuth2Request.properties.value,
                  UpsertPlatformOAuth2Request.properties.value,
                ]),
                ['props'],
              ),
              Type.Object({
                props: Type.Optional(
                  piecePropertiesUtils.buildSchema(auth.props ?? {}, undefined),
                ),
              }),
            ]),
          }),
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
}

export const formUtils = {
  /**When we use deepEqual if one object has an undefined value and the other doesn't have the key, that's an unequality, so to be safe we remove undefined values */
  removeUndefinedFromInput: (step: FlowAction | FlowTrigger) => {
    const copiedStep = JSON.parse(JSON.stringify(step)) as
      | FlowAction
      | FlowTrigger;
    if (
      copiedStep.type !== FlowTriggerType.PIECE &&
      copiedStep.type !== FlowActionType.PIECE
    ) {
      return step;
    }

    copiedStep.settings.input = Object.fromEntries(
      Object.entries(copiedStep.settings.input).filter(
        ([_, value]) => value !== undefined,
      ),
    );
    copiedStep.nextAction = null;
    return copiedStep;
  },

  buildPieceSchema: (
    type: FlowActionType | FlowTriggerType,
    actionNameOrTriggerName: string,
    piece: PieceMetadataModel | null,
  ) => {
    switch (type) {
      case FlowActionType.LOOP_ON_ITEMS:
        return Type.Composite([
          Type.Omit(LoopOnItemsActionSchema, ['settings']),
          Type.Object({
            settings: Type.Object({
              items: Type.String({
                minLength: 1,
              }),
            }),
          }),
        ]);
      case FlowActionType.ROUTER:
        return Type.Intersect([
          Type.Omit(RouterActionSchema, ['settings']),
          Type.Object({
            settings: Type.Object({
              branches: RouterBranchesSchema(true),
              executionType: Type.Enum(RouterExecutionType),
              sampleData: SampleDataSetting,
            }),
          }),
        ]);
      case FlowActionType.CODE:
        return CodeActionSchema;
      case FlowActionType.PIECE: {
        return Type.Composite([
          Type.Omit(PieceActionSchema, ['settings']),
          Type.Object({
            settings: Type.Composite([
              Type.Omit(PieceActionSettings, ['input', 'actionName']),
              Type.Object({
                actionName: Type.String({
                  minLength: 1,
                }),
                input: buildInputSchemaForStep(
                  type,
                  piece,
                  actionNameOrTriggerName,
                ),
              }),
            ]),
          }),
        ]);
      }
      case FlowTriggerType.PIECE: {
        return Type.Composite([
          Type.Omit(PieceTrigger, ['settings']),
          Type.Object({
            settings: Type.Composite([
              Type.Omit(PieceTriggerSettings, ['input', 'triggerName']),
              Type.Object({
                triggerName: Type.String({
                  minLength: 1,
                }),
                input: buildInputSchemaForStep(
                  type,
                  piece,
                  actionNameOrTriggerName,
                ),
              }),
            ]),
          }),
        ]);
      }
      default: {
        throw new Error('Unsupported type: ' + type);
      }
    }
  },
  getDefaultValueForProperties,
  buildConnectionSchema,
  getDefaultPropertyValue,
};
