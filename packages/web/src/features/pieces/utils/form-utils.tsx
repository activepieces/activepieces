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
  AppConnectionScope,
  AppConnectionType,
  CodeActionSchema,
  LoopOnItemsActionSchema,
  Metadata,
  PieceActionSchema,
  PieceActionSettings,
  PieceTrigger,
  isNil,
  RouterActionSchema,
  RouterBranchesSchema,
  RouterExecutionType,
  UpsertCloudOAuth2Request,
  UpsertCustomAuthRequest,
  UpsertBasicAuthRequest,
  UpsertNoAuthRequest,
  UpsertOAuth2Request,
  UpsertPlatformOAuth2Request,
  UpsertSecretTextRequest,
  FlowTriggerType,
  FlowActionType,
  FlowAction,
  FlowTrigger,
  PropertyExecutionType,
  PropertySettings,
  PieceTriggerSettings,
  AUTHENTICATION_PROPERTY_NAME,
  OAuth2GrantType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { z, ZodObject, ZodType } from 'zod';

function buildInputSchemaForStep(
  type: FlowActionType | FlowTriggerType,
  piece: PieceMetadata | null,
  actionNameOrTriggerName: string,
): ZodType {
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
      return z.object({});
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
      return z.object({});
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
  const defaultValues = Object.entries(props).reduce<Record<string, unknown>>(
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
  if (existingInput[AUTHENTICATION_PROPERTY_NAME]) {
    defaultValues[AUTHENTICATION_PROPERTY_NAME] =
      existingInput[AUTHENTICATION_PROPERTY_NAME];
  }
  return defaultValues;
}

const EXTERNAL_ID_SCHEMA = z
  .string()
  .min(1, {
    error: t('External ID can only contain letters, numbers and underscores'),
  })
  .regex(/^[A-Za-z0-9_\-@+.]*$/, {
    error: t('External ID can only contain letters, numbers and underscores'),
  });

function displayNameSchema(required: boolean) {
  if (required) {
    return z.string().min(1, { error: t('required') });
  }
  return z.string();
}

const PROJECT_FORM_EXTRAS_SCHEMA = z.object({
  pieceVersion: z.string().optional(),
  projectIds: z.array(z.string()),
  preSelectForNewProjects: z.boolean(),
});

const GLOBAL_CONNECTION_EXTRAS_SCHEMA = z.object({
  scope: z.literal(AppConnectionScope.PLATFORM),
  projectIds: z
    .array(z.string())
    .min(1, { error: t('Please select at least one project') }),
  metadata: Metadata.optional(),
  preSelectForNewProjects: z.boolean().optional(),
});

function connectionNameSchema(required: boolean) {
  return z.object({
    externalId: EXTERNAL_ID_SCHEMA,
    displayName: displayNameSchema(required),
  });
}

function buildOAuth2ValueSchema(
  auth: PieceAuthProperty,
  connectionType:
    | AppConnectionType.OAUTH2
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2,
) {
  if (auth.type !== PropertyType.OAUTH2) {
    throw new Error('buildOAuth2ValueSchema expects OAuth2 auth');
  }
  const propsSchema = piecePropertiesUtils.buildSchema(
    auth.props ?? {},
    undefined,
  );
  const isClientCredsGrantType =
    auth.grantType === OAuth2GrantType.CLIENT_CREDENTIALS;

  const withPropsAndCode = {
    props: propsSchema.optional(),
    code: isClientCredsGrantType
      ? z.string().optional()
      : z.string().min(1, {
          error: t('Please connect your account first'),
        }),
  } as const;

  switch (connectionType) {
    case AppConnectionType.OAUTH2:
      return UpsertOAuth2Request.shape.value
        .omit({ props: true })
        .extend(withPropsAndCode);
    case AppConnectionType.CLOUD_OAUTH2:
      return UpsertCloudOAuth2Request.shape.value
        .omit({ props: true })
        .extend(withPropsAndCode);
    case AppConnectionType.PLATFORM_OAUTH2:
      return UpsertPlatformOAuth2Request.shape.value
        .omit({ props: true })
        .extend(withPropsAndCode);
  }
}

const PROJECT_NAME_OMIT = { externalId: true, displayName: true } as const;
const GLOBAL_NAME_OMIT = {
  projectId: true,
  externalId: true,
  displayName: true,
} as const;
const PROJECT_NAME_AND_VALUE_OMIT = {
  ...PROJECT_NAME_OMIT,
  value: true,
} as const;
const GLOBAL_NAME_AND_VALUE_OMIT = {
  ...GLOBAL_NAME_OMIT,
  value: true,
} as const;

const CUSTOM_AUTH_VALUE_PROPS = z.object({
  value: z.object({
    props: z.record(z.string(), z.unknown()),
  }),
});

function extendUpsertSchema(
  upsertSchema: ZodObject<z.ZodRawShape>,
  names: ReturnType<typeof connectionNameSchema>,
  isGlobalConnection: boolean,
) {
  const base = upsertSchema
    .omit(isGlobalConnection ? GLOBAL_NAME_OMIT : PROJECT_NAME_OMIT)
    .extend(names.shape);
  return isGlobalConnection
    ? base
        .extend(GLOBAL_CONNECTION_EXTRAS_SCHEMA.shape)
        .extend(PROJECT_FORM_EXTRAS_SCHEMA.shape)
    : base.extend(PROJECT_FORM_EXTRAS_SCHEMA.shape);
}

function extendCustomAuthUpsertSchema(
  names: ReturnType<typeof connectionNameSchema>,
  isGlobalConnection: boolean,
) {
  const omit = isGlobalConnection
    ? GLOBAL_NAME_AND_VALUE_OMIT
    : PROJECT_NAME_AND_VALUE_OMIT;
  const base = UpsertCustomAuthRequest.omit(omit).extend(names.shape);
  const withExtras = isGlobalConnection
    ? base
        .extend(GLOBAL_CONNECTION_EXTRAS_SCHEMA.shape)
        .extend(PROJECT_FORM_EXTRAS_SCHEMA.shape)
    : base.extend(PROJECT_FORM_EXTRAS_SCHEMA.shape);
  return withExtras.extend(CUSTOM_AUTH_VALUE_PROPS.shape);
}

function buildOAuth2RequestSchema(
  auth: PieceAuthProperty,
  showConnectionNameField: boolean,
  isGlobalConnection: boolean,
) {
  const names = connectionNameSchema(showConnectionNameField);
  const omit = isGlobalConnection
    ? GLOBAL_NAME_AND_VALUE_OMIT
    : PROJECT_NAME_AND_VALUE_OMIT;
  const buildBranch = (
    schema: ZodObject<z.ZodRawShape>,
    connectionType:
      | AppConnectionType.OAUTH2
      | AppConnectionType.CLOUD_OAUTH2
      | AppConnectionType.PLATFORM_OAUTH2,
  ) => {
    const valueShape = z.object({
      value: buildOAuth2ValueSchema(auth, connectionType),
    });
    const base = schema.omit(omit).extend(names.shape);
    return isGlobalConnection
      ? base
          .extend(GLOBAL_CONNECTION_EXTRAS_SCHEMA.shape)
          .extend(valueShape.shape)
          .extend(PROJECT_FORM_EXTRAS_SCHEMA.shape)
      : base.extend(valueShape.shape).extend(PROJECT_FORM_EXTRAS_SCHEMA.shape);
  };

  return z.object({
    request: z.discriminatedUnion('type', [
      buildBranch(UpsertOAuth2Request, AppConnectionType.OAUTH2),
      buildBranch(UpsertCloudOAuth2Request, AppConnectionType.CLOUD_OAUTH2),
      buildBranch(
        UpsertPlatformOAuth2Request,
        AppConnectionType.PLATFORM_OAUTH2,
      ),
    ]),
  });
}

function buildFallbackConnectionSchema(options: {
  isGlobalConnection: boolean;
  showConnectionNameField: boolean;
}) {
  const names = connectionNameSchema(options.showConnectionNameField);
  const isGlobal = options.isGlobalConnection;

  return z.object({
    request: z.union([
      extendUpsertSchema(UpsertSecretTextRequest, names, isGlobal),
      extendUpsertSchema(UpsertOAuth2Request, names, isGlobal),
      extendUpsertSchema(UpsertCloudOAuth2Request, names, isGlobal),
      extendUpsertSchema(UpsertPlatformOAuth2Request, names, isGlobal),
      extendUpsertSchema(UpsertBasicAuthRequest, names, isGlobal),
      extendCustomAuthUpsertSchema(names, isGlobal),
      extendUpsertSchema(UpsertNoAuthRequest, names, isGlobal),
    ]),
  });
}

function buildCustomAuthValueSchema(auth: PieceAuthProperty) {
  if (auth.type !== PropertyType.CUSTOM_AUTH) {
    throw new Error('buildCustomAuthValueSchema expects CUSTOM_AUTH');
  }
  return z.object({
    value: z.object({
      type: z.literal(AppConnectionType.CUSTOM_AUTH),
      props: piecePropertiesUtils.buildSchema(auth.props, undefined),
    }),
  });
}

function buildConnectionSchema(
  auth: PieceAuthProperty | null,
  options: {
    isGlobalConnection: boolean;
    showConnectionNameField: boolean;
  },
) {
  const { isGlobalConnection, showConnectionNameField } = options;
  if (isNil(auth)) {
    return buildFallbackConnectionSchema({
      isGlobalConnection,
      showConnectionNameField,
    });
  }

  const names = connectionNameSchema(showConnectionNameField);

  switch (auth.type) {
    case PropertyType.SECRET_TEXT:
    case PropertyType.BASIC_AUTH: {
      const base =
        auth.type === PropertyType.SECRET_TEXT
          ? UpsertSecretTextRequest
          : UpsertBasicAuthRequest;
      return z.object({
        request: extendUpsertSchema(base, names, isGlobalConnection),
      });
    }
    case PropertyType.CUSTOM_AUTH: {
      const valueShape = buildCustomAuthValueSchema(auth);
      return z.object({
        request: extendUpsertSchema(
          UpsertCustomAuthRequest.omit({ value: true }),
          names,
          isGlobalConnection,
        ).extend(valueShape.shape),
      });
    }
    case PropertyType.OAUTH2: {
      return buildOAuth2RequestSchema(
        auth,
        showConnectionNameField,
        isGlobalConnection,
      );
    }
    default: {
      return buildFallbackConnectionSchema({
        isGlobalConnection,
        showConnectionNameField,
      });
    }
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
        return LoopOnItemsActionSchema.omit({ settings: true }).extend(
          z.object({
            settings: z.object({
              items: z.string().min(1),
            }),
          }).shape,
        );
      case FlowActionType.ROUTER:
        return RouterActionSchema.omit({ settings: true }).extend(
          z.object({
            settings: z.object({
              branches: RouterBranchesSchema(true),
              executionType: z.enum(RouterExecutionType),
            }),
          }).shape,
        );
      case FlowActionType.CODE:
        return CodeActionSchema;
      case FlowActionType.PIECE: {
        return PieceActionSchema.omit({ settings: true }).extend(
          z.object({
            settings: PieceActionSettings.omit({
              input: true,
              actionName: true,
            }).extend(
              z.object({
                actionName: z.string().min(1),
                input: buildInputSchemaForStep(
                  type,
                  piece,
                  actionNameOrTriggerName,
                ),
              }).shape,
            ),
          }).shape,
        );
      }
      case FlowTriggerType.PIECE: {
        return PieceTrigger.omit({ settings: true }).extend(
          z.object({
            settings: PieceTriggerSettings.omit({
              input: true,
              triggerName: true,
            }).extend(
              z.object({
                triggerName: z.string().min(1),
                input: buildInputSchemaForStep(
                  type,
                  piece,
                  actionNameOrTriggerName,
                ),
              }).shape,
            ),
          }).shape,
        );
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

export type BuildConnectionSchemaOptions = {
  isGlobalConnection: boolean;
  showConnectionNameField: boolean;
};
