import { TSchema, Type } from '@sinclair/typebox';

import {
  CONNECTION_REGEX,
  PieceMetadata,
  PieceMetadataModel,
  PiecePropertyMap,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  Action,
  ActionType,
  BranchActionSchema,
  BranchOperator,
  CodeActionSchema,
  ExactPieceTrigger,
  LoopOnItemsActionSchema,
  PieceActionSchema,
  Trigger,
  TriggerType,
  ValidBranchCondition,
} from '@activepieces/shared';

export const formUtils = {
  buildPieceDefaultValue: (
    selectedStep: Action | Trigger,
    piece: PieceMetadata | null,
  ): Action | Trigger => {
    const { type } = selectedStep;
    switch (type) {
      case ActionType.LOOP_ON_ITEMS:
        return {
          ...selectedStep,
          settings: {
            ...selectedStep.settings,
            items: selectedStep.settings.items ?? '',
          },
        };
      case ActionType.BRANCH:
        return {
          ...selectedStep,
          settings: {
            ...selectedStep.settings,
            conditions: selectedStep.settings.conditions ?? [
              [
                {
                  operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                  firstValue: '',
                  secondValue: '',
                  caseSensitive: false,
                },
              ],
            ],
            inputUiInfo: {},
          },
        };
      case ActionType.CODE: {
        const defaultCode = `export const code = async (inputs) => {
  return true;
};`;
        return {
          ...selectedStep,
          settings: {
            ...selectedStep.settings,
            sourceCode: {
              code: selectedStep.settings.sourceCode.code ?? defaultCode,
              packageJson: selectedStep.settings.sourceCode.packageJson ?? '{}',
            },
          },
        };
      }
      case ActionType.PIECE: {
        const props =
          piece?.actions?.[selectedStep?.settings?.actionName]?.props ?? {};
        const input = (selectedStep?.settings?.input ?? {}) as Record<
          string,
          unknown
        >;
        const defaultValues = getDefaultValueForStep(props, input);
        return {
          ...selectedStep,
          settings: {
            ...selectedStep.settings,
            input: defaultValues,
          },
        };
      }
      case TriggerType.PIECE: {
        const props =
          piece?.triggers?.[selectedStep?.settings?.triggerName]?.props ?? {};
        const input = (selectedStep?.settings?.input ?? {}) as Record<
          string,
          unknown
        >;
        const defaultValues = getDefaultValueForStep(props, input);

        return {
          ...selectedStep,
          settings: {
            ...selectedStep.settings,
            input: defaultValues,
          },
        };
      }
      default:
        throw new Error('Unsupported type: ' + type);
    }
  },
  buildPieceSchema: (
    type: ActionType | TriggerType,
    actionNameOrTriggerName: string,
    piece: PieceMetadataModel | null,
  ) => {
    switch (type) {
      case ActionType.LOOP_ON_ITEMS:
        return Type.Composite([
          LoopOnItemsActionSchema,
          Type.Object({
            settings: Type.Object({
              items: Type.String({
                minLength: 1,
              }),
            }),
          }),
        ]);
      case ActionType.BRANCH:
        return Type.Composite([
          BranchActionSchema,
          Type.Object({
            settings: Type.Object({
              conditions: Type.Array(Type.Array(ValidBranchCondition)),
            }),
          }),
        ]);
      case ActionType.CODE:
        return CodeActionSchema;
      case ActionType.PIECE: {
        return Type.Composite([
          PieceActionSchema,
          Type.Object({
            settings: Type.Object({
              actionName: Type.String({
                minLength: 1,
              }),
              input:
                piece &&
                actionNameOrTriggerName &&
                piece.actions[actionNameOrTriggerName]
                  ? formUtils.buildSchema(
                      piece.actions[actionNameOrTriggerName].props,
                    )
                  : Type.Object({}),
            }),
          }),
        ]);
      }
      case TriggerType.PIECE: {
        const formSchema =
          piece &&
          actionNameOrTriggerName &&
          piece.triggers[actionNameOrTriggerName]
            ? formUtils.buildSchema(
                piece.triggers[actionNameOrTriggerName].props,
              )
            : Type.Object({});
        return ExactPieceTrigger(formSchema);
      }
      default: {
        throw new Error('Unsupported type: ' + type);
      }
    }
  },
  buildSchema: (props: PiecePropertyMap) => {
    const entries = Object.entries(props);
    const nonNullableUnknownPropType = Type.Not(
      Type.Union([Type.Null(), Type.Undefined()]),
      Type.Unknown(),
    );
    const propsSchema: Record<string, TSchema> = {};
    for (const [name, property] of entries) {
      switch (property.type) {
        case PropertyType.MARKDOWN:
          propsSchema[name] = Type.Optional(
            Type.Union([
              Type.Null(),
              Type.Undefined(),
              Type.Never(),
              Type.Unknown(),
            ]),
          );
          break;
        case PropertyType.DATE_TIME:
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.FILE:
          propsSchema[name] = Type.String({
            minLength: property.required ? 1 : undefined,
          });
          break;
        case PropertyType.CHECKBOX:
          propsSchema[name] = Type.Union([
            Type.Boolean(),
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
          ]);
          break;
        case PropertyType.NUMBER:
          // Because it could be a variable
          propsSchema[name] = Type.Union([
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
            Type.Number(),
          ]);
          break;
        case PropertyType.STATIC_DROPDOWN:
          propsSchema[name] = nonNullableUnknownPropType;
          break;
        case PropertyType.DROPDOWN:
          propsSchema[name] = nonNullableUnknownPropType;
          break;
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.SECRET_TEXT:
        case PropertyType.OAUTH2:
          // Only accepts connections variable.
          propsSchema[name] = Type.Union([
            Type.String({
              pattern: CONNECTION_REGEX,
              minLength: property.required ? 1 : undefined,
            }),
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
          ]);
          break;
        case PropertyType.ARRAY:
          // Only accepts connections variable.
          propsSchema[name] = Type.Union([
            Type.Array(Type.Unknown({})),
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
          ]);
          break;
        case PropertyType.OBJECT:
          propsSchema[name] = Type.Union([
            Type.Record(Type.String(), Type.Any()),
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
          ]);
          break;
        case PropertyType.JSON:
          propsSchema[name] = Type.Union([
            Type.Record(Type.String(), Type.Any()),
            Type.Array(Type.Any()),
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
          ]);
          break;
        case PropertyType.MULTI_SELECT_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
          propsSchema[name] = Type.Union([
            Type.Array(Type.Any()),
            Type.String({
              minLength: property.required ? 1 : undefined,
            }),
          ]);
          break;
        case PropertyType.DYNAMIC:
          propsSchema[name] = Type.Record(Type.String(), Type.Any());
          break;
      }

      if (!property.required) {
        propsSchema[name] = Type.Optional(
          Type.Union([Type.Null(), Type.Undefined(), propsSchema[name]]),
        );
      }
    }

    return Type.Object(propsSchema);
  },
};

function getDefaultValueForStep(
  props: PiecePropertyMap,
  input: Record<string, unknown>,
): Record<string, unknown> {
  const defaultValues: Record<string, unknown> = {};
  const entries = Object.entries(props);
  for (const [name, property] of entries) {
    switch (property.type) {
      case PropertyType.MARKDOWN:
      case PropertyType.DATE_TIME:
      case PropertyType.SHORT_TEXT:
      case PropertyType.LONG_TEXT:
      case PropertyType.FILE:
      case PropertyType.CHECKBOX:
      case PropertyType.NUMBER:
      case PropertyType.STATIC_DROPDOWN:
      case PropertyType.DROPDOWN:
      case PropertyType.BASIC_AUTH:
      case PropertyType.CUSTOM_AUTH:
      case PropertyType.SECRET_TEXT:
      case PropertyType.OAUTH2:
      case PropertyType.ARRAY:
      case PropertyType.OBJECT:
      case PropertyType.JSON: {
        defaultValues[name] = input[name] ?? property.defaultValue ?? '';
        break;
      }
      case PropertyType.MULTI_SELECT_DROPDOWN:
        defaultValues[name] = [];
        break;
      case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
        defaultValues[name] = [];
        break;
      case PropertyType.DYNAMIC:
        defaultValues[name] = {};
        break;
    }
  }
  return defaultValues;
}
