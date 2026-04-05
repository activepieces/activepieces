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
  SampleDataSetting,
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

function buildExternalIdSchema() {
  return z
    .string()
    .min(1, {
      error: t('Name can only contain letters, numbers and underscores'),
    })
    .regex(/^[A-Za-z0-9_\-@+.]*$/, {
      error: t('Name can only contain letters, numbers and underscores'),
    });
}

function buildDisplayNameSchema(showConnectionNameField: boolean) {
  if (showConnectionNameField) {
    return z.string().min(1, { error: t('required') });
  }
  return z.string();
}

function projectFormExtrasSchema(): ZodObject<z.ZodRawShape> {
  return z.object({
    pieceVersion: z.string().optional(),
    projectIds: z.array(z.string()),
    preSelectForNewProjects: z.boolean(),
  });
}

function buildGlobalConnectionExtrasSchema(): ZodObject<z.ZodRawShape> {
  return z.object({
    scope: z.literal(AppConnectionScope.PLATFORM),
    projectIds: z.array(z.string()).min(1, { error: t('required') }),
    metadata: Metadata.optional(),
    preSelectForNewProjects: z.boolean().optional(),
  });
}

function connectionNameFields(showConnectionNameField: boolean) {
  return z.object({
    externalId: buildExternalIdSchema(),
    displayName: buildDisplayNameSchema(showConnectionNameField),
  });
}

function oauth2ValueWithPieceProps(
  auth: PieceAuthProperty,
  connectionType:
    | AppConnectionType.OAUTH2
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2,
) {
  if (auth.type !== PropertyType.OAUTH2) {
    throw new Error('oauth2ValueWithPieceProps expects OAuth2 auth');
  }
  const propsSchema = piecePropertiesUtils.buildSchema(
    auth.props ?? {},
    undefined,
  );
  switch (connectionType) {
    case AppConnectionType.OAUTH2:
      return UpsertOAuth2Request.shape.value
        .omit({ props: true })
        .extend({ props: propsSchema.optional() });
    case AppConnectionType.CLOUD_OAUTH2:
      return UpsertCloudOAuth2Request.shape.value
        .omit({ props: true })
        .extend({ props: propsSchema.optional() });
    case AppConnectionType.PLATFORM_OAUTH2:
      return UpsertPlatformOAuth2Request.shape.value
        .omit({ props: true })
        .extend({ props: propsSchema.optional() });
  }
}

function buildOAuth2RequestSchema(
  auth: PieceAuthProperty,
  showConnectionNameField: boolean,
  isGlobalConnection: boolean,
) {
  const names = connectionNameFields(showConnectionNameField);
  const projectExtras = projectFormExtrasSchema();
  const valueFor = (
    connectionType:
      | AppConnectionType.OAUTH2
      | AppConnectionType.CLOUD_OAUTH2
      | AppConnectionType.PLATFORM_OAUTH2,
  ) => z.object({ value: oauth2ValueWithPieceProps(auth, connectionType) });

  if (isGlobalConnection) {
    const globalExtras = buildGlobalConnectionExtrasSchema();
    const omitGlobal = {
      projectId: true,
      externalId: true,
      displayName: true,
      value: true,
    } as const;
    return z.object({
      request: z.discriminatedUnion('type', [
        UpsertOAuth2Request.omit(omitGlobal)
          .extend(names.shape)
          .extend(globalExtras.shape)
          .extend(valueFor(AppConnectionType.OAUTH2).shape)
          .extend(projectExtras.shape),
        UpsertCloudOAuth2Request.omit(omitGlobal)
          .extend(names.shape)
          .extend(globalExtras.shape)
          .extend(valueFor(AppConnectionType.CLOUD_OAUTH2).shape)
          .extend(projectExtras.shape),
        UpsertPlatformOAuth2Request.omit(omitGlobal)
          .extend(names.shape)
          .extend(globalExtras.shape)
          .extend(valueFor(AppConnectionType.PLATFORM_OAUTH2).shape)
          .extend(projectExtras.shape),
      ]),
    });
  }

  const omitProject = {
    externalId: true,
    displayName: true,
    value: true,
  } as const;
  return z.object({
    request: z.discriminatedUnion('type', [
      UpsertOAuth2Request.omit(omitProject)
        .extend(names.shape)
        .extend(valueFor(AppConnectionType.OAUTH2).shape)
        .extend(projectExtras.shape),
      UpsertCloudOAuth2Request.omit(omitProject)
        .extend(names.shape)
        .extend(valueFor(AppConnectionType.CLOUD_OAUTH2).shape)
        .extend(projectExtras.shape),
      UpsertPlatformOAuth2Request.omit(omitProject)
        .extend(names.shape)
        .extend(valueFor(AppConnectionType.PLATFORM_OAUTH2).shape)
        .extend(projectExtras.shape),
    ]),
  });
}

const CUSTOM_AUTH_VALUE_PROPS = z.object({
  value: z.object({
    props: z.record(z.string(), z.unknown()),
  }),
});

/** Omit keys replaced by connection name fields on the create-connection form (project-scoped upsert). */
const OMIT_UPSERT_CONNECTION_NAME_PROJECT = {
  externalId: true,
  displayName: true,
} as const;

/** Custom auth also omits `value` so we can attach placeholder props in the nil-default union. */
const OMIT_UPSERT_CUSTOM_AUTH_VALUE_PROJECT = {
  externalId: true,
  displayName: true,
  value: true,
} as const;

/** Omit keys for global connection upserts (includes projectId). */
const OMIT_UPSERT_CONNECTION_NAME_GLOBAL = {
  projectId: true,
  externalId: true,
  displayName: true,
} as const;

const OMIT_UPSERT_CUSTOM_AUTH_VALUE_GLOBAL = {
  projectId: true,
  externalId: true,
  displayName: true,
  value: true,
} as const;

function extendUpsertForNilDefaultUnionProjectScoped(
  upsertSchema: ZodObject<z.ZodRawShape>,
  names: ReturnType<typeof connectionNameFields>,
  projectExtras: ReturnType<typeof projectFormExtrasSchema>,
) {
  return upsertSchema
    .omit(OMIT_UPSERT_CONNECTION_NAME_PROJECT)
    .extend(names.shape)
    .extend(projectExtras.shape);
}

function extendUpsertForNilDefaultUnionProjectScopedCustomAuth(
  names: ReturnType<typeof connectionNameFields>,
  projectExtras: ReturnType<typeof projectFormExtrasSchema>,
) {
  return UpsertCustomAuthRequest.omit(OMIT_UPSERT_CUSTOM_AUTH_VALUE_PROJECT)
    .extend(names.shape)
    .extend(projectExtras.shape)
    .extend(CUSTOM_AUTH_VALUE_PROPS.shape);
}

function extendUpsertForNilDefaultUnionGlobal(
  upsertSchema: ZodObject<z.ZodRawShape>,
  names: ReturnType<typeof connectionNameFields>,
  globalExtras: ReturnType<typeof buildGlobalConnectionExtrasSchema>,
  projectExtras: ReturnType<typeof projectFormExtrasSchema>,
) {
  return upsertSchema
    .omit(OMIT_UPSERT_CONNECTION_NAME_GLOBAL)
    .extend(names.shape)
    .extend(globalExtras.shape)
    .extend(projectExtras.shape);
}

function extendUpsertForNilDefaultUnionGlobalCustomAuth(
  names: ReturnType<typeof connectionNameFields>,
  globalExtras: ReturnType<typeof buildGlobalConnectionExtrasSchema>,
  projectExtras: ReturnType<typeof projectFormExtrasSchema>,
) {
  return UpsertCustomAuthRequest.omit(OMIT_UPSERT_CUSTOM_AUTH_VALUE_GLOBAL)
    .extend(names.shape)
    .extend(globalExtras.shape)
    .extend(projectExtras.shape)
    .extend(CUSTOM_AUTH_VALUE_PROPS.shape);
}

function buildNilOrDefaultRequestUnion(options: {
  isGlobalConnection: boolean;
  showConnectionNameField: boolean;
}) {
  const names = connectionNameFields(options.showConnectionNameField);
  const projectExtras = projectFormExtrasSchema();
  if (!options.isGlobalConnection) {
    return z.object({
      request: z.union([
        extendUpsertForNilDefaultUnionProjectScoped(
          UpsertSecretTextRequest,
          names,
          projectExtras,
        ),
        extendUpsertForNilDefaultUnionProjectScoped(
          UpsertOAuth2Request,
          names,
          projectExtras,
        ),
        extendUpsertForNilDefaultUnionProjectScoped(
          UpsertCloudOAuth2Request,
          names,
          projectExtras,
        ),
        extendUpsertForNilDefaultUnionProjectScoped(
          UpsertPlatformOAuth2Request,
          names,
          projectExtras,
        ),
        extendUpsertForNilDefaultUnionProjectScoped(
          UpsertBasicAuthRequest,
          names,
          projectExtras,
        ),
        extendUpsertForNilDefaultUnionProjectScopedCustomAuth(
          names,
          projectExtras,
        ),
        extendUpsertForNilDefaultUnionProjectScoped(
          UpsertNoAuthRequest,
          names,
          projectExtras,
        ),
      ]),
    });
  }
  const globalExtras = buildGlobalConnectionExtrasSchema();
  return z.object({
    request: z.union([
      extendUpsertForNilDefaultUnionGlobal(
        UpsertSecretTextRequest,
        names,
        globalExtras,
        projectExtras,
      ),
      extendUpsertForNilDefaultUnionGlobal(
        UpsertOAuth2Request,
        names,
        globalExtras,
        projectExtras,
      ),
      extendUpsertForNilDefaultUnionGlobal(
        UpsertCloudOAuth2Request,
        names,
        globalExtras,
        projectExtras,
      ),
      extendUpsertForNilDefaultUnionGlobal(
        UpsertPlatformOAuth2Request,
        names,
        globalExtras,
        projectExtras,
      ),
      extendUpsertForNilDefaultUnionGlobal(
        UpsertBasicAuthRequest,
        names,
        globalExtras,
        projectExtras,
      ),
      extendUpsertForNilDefaultUnionGlobalCustomAuth(
        names,
        globalExtras,
        projectExtras,
      ),
      extendUpsertForNilDefaultUnionGlobal(
        UpsertNoAuthRequest,
        names,
        globalExtras,
        projectExtras,
      ),
    ]),
  });
}

function customAuthValueShape(auth: PieceAuthProperty) {
  if (auth.type !== PropertyType.CUSTOM_AUTH) {
    throw new Error('customAuthValueShape expects CUSTOM_AUTH');
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
    return buildNilOrDefaultRequestUnion({
      isGlobalConnection,
      showConnectionNameField,
    });
  }

  const names = connectionNameFields(showConnectionNameField);
  const projectExtras = projectFormExtrasSchema();

  switch (auth.type) {
    case PropertyType.SECRET_TEXT: {
      if (isGlobalConnection) {
        return z.object({
          request: UpsertSecretTextRequest.omit({
            projectId: true,
            externalId: true,
            displayName: true,
          })
            .extend(names.shape)
            .extend(buildGlobalConnectionExtrasSchema().shape)
            .extend(projectExtras.shape),
        });
      }
      return z.object({
        request: UpsertSecretTextRequest.omit({
          externalId: true,
          displayName: true,
        })
          .extend(names.shape)
          .extend(projectExtras.shape),
      });
    }
    case PropertyType.BASIC_AUTH: {
      if (isGlobalConnection) {
        return z.object({
          request: UpsertBasicAuthRequest.omit({
            projectId: true,
            externalId: true,
            displayName: true,
          })
            .extend(names.shape)
            .extend(buildGlobalConnectionExtrasSchema().shape)
            .extend(projectExtras.shape),
        });
      }
      return z.object({
        request: UpsertBasicAuthRequest.omit({
          externalId: true,
          displayName: true,
        })
          .extend(names.shape)
          .extend(projectExtras.shape),
      });
    }
    case PropertyType.CUSTOM_AUTH: {
      const valueShape = customAuthValueShape(auth);
      if (isGlobalConnection) {
        return z.object({
          request: UpsertCustomAuthRequest.omit({
            projectId: true,
            externalId: true,
            displayName: true,
            value: true,
          })
            .extend(names.shape)
            .extend(buildGlobalConnectionExtrasSchema().shape)
            .extend(projectExtras.shape)
            .extend(valueShape.shape),
        });
      }
      return z.object({
        request: UpsertCustomAuthRequest.omit({
          externalId: true,
          displayName: true,
          value: true,
        })
          .extend(names.shape)
          .extend(projectExtras.shape)
          .extend(valueShape.shape),
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
      return buildNilOrDefaultRequestUnion({
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
              sampleData: SampleDataSetting,
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
