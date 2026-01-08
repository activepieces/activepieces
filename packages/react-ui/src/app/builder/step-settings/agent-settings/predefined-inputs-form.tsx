import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type, Static } from '@sinclair/typebox';
import { t } from 'i18next';
import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { Form, FormField } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConnectionDropdown } from '@/features/agents/agent-tools/piece-tool-dialog/connection-select';
import { useAgentToolsStore } from '@/features/agents/agent-tools/store';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';
import { ActionBase, PieceProperty } from '@activepieces/pieces-framework';
import {
  FieldControlMode,
  isNil,
  PredefinedInputField,
  PredefinedInputsStructure,
} from '@activepieces/shared';

import { selectGenericFormComponentForProperty } from '../../piece-properties/properties-utils';

const createPredefinedInputsFormSchema = (requireAuth: boolean) =>
  Type.Object(
    requireAuth
      ? {
          auth: Type.String({ minLength: 1 }),
        }
      : {},
    {
      additionalProperties: true,
      ...(requireAuth && { required: ['auth'] }),
    },
  );

type PredefinedInputsPropsForm = {
  action: ActionBase;
  piece: PieceStepMetadataWithSuggestions;
};

export const PredefinedInputsForm = ({
  action,
  piece,
}: PredefinedInputsPropsForm) => {
  const { predefinedInputs, setPredefinedInputs } = useAgentToolsStore();

  const isUpdatingMode = useRef(false);

  const { pieces } = piecesHooks.usePieces({});
  const selectedPiece = pieces?.find((p) => p.name === piece.pieceName);

  const pieceHasAuth =
    !isNil(selectedPiece) && !isNil(selectedPiece.auth) && action.requireAuth;

  const formSchema = useMemo(
    () => createPredefinedInputsFormSchema(pieceHasAuth),
    [pieceHasAuth],
  );
  type PredefinedInputsForm = Static<typeof formSchema>;

  const initialFormValues = useMemo(() => {
    const values: Record<string, unknown> = {};

    if (pieceHasAuth && predefinedInputs?.auth) {
      values.auth = predefinedInputs.auth;
    }

    if (predefinedInputs?.fields) {
      Object.entries(predefinedInputs.fields).forEach(([key, field]) => {
        if (
          field.mode === FieldControlMode.CHOOSE_YOURSELF &&
          field.value !== undefined
        ) {
          values[key] = field.value;
        }
      });
    }

    return values;
  }, [predefinedInputs, pieceHasAuth]);

  const form = useForm<PredefinedInputsForm>({
    mode: 'all',
    reValidateMode: 'onChange',
    resolver: typeboxResolver(formSchema),
    defaultValues: initialFormValues,
  });

  const props = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(action.props).map(([propertyName, property]) => [
          propertyName,
          {
            ...property,
            allowEmptyValue: !property.required,
            required: false,
          } as PieceProperty & { allowEmptyValue: boolean },
        ]),
      ),
    [action.props],
  );

  useEffect(() => {
    const subscription = form.watch((formValues, { name }) => {
      if (isUpdatingMode.current) {
        return;
      }

      const { auth, ...fieldValues } = formValues;

      const newPredefinedInputs: PredefinedInputsStructure = {
        fields: {},
      };

      if (pieceHasAuth && auth) {
        newPredefinedInputs.auth = auth as string;
      }

      const existingFields = predefinedInputs?.fields || {};

      Object.keys(props).forEach((propertyName) => {
        const existingField = existingFields[propertyName];
        const mode = existingField?.mode || FieldControlMode.AGENT_DECIDE;

        newPredefinedInputs.fields[propertyName] = {
          mode,
          value:
            mode === FieldControlMode.CHOOSE_YOURSELF
              ? fieldValues[propertyName]
              : existingField?.value,
        };
      });

      setPredefinedInputs(newPredefinedInputs);
    });

    return () => subscription.unsubscribe();
  }, [
    form,
    setPredefinedInputs,
    pieceHasAuth,
    props,
    predefinedInputs?.fields,
  ]);

  const handleFieldControlModeChange = (
    propertyName: string,
    mode: FieldControlMode,
  ) => {
    isUpdatingMode.current = true;

    const currentFormValue = form.getValues(propertyName);

    const existingFields = predefinedInputs?.fields || {};
    const updatedFields: Record<string, PredefinedInputField> = {};

    Object.keys(props).forEach((key) => {
      if (key === propertyName) {
        updatedFields[key] = {
          mode,
          value:
            mode === FieldControlMode.CHOOSE_YOURSELF
              ? currentFormValue
              : undefined,
        };
      } else if (existingFields[key]) {
        updatedFields[key] = existingFields[key];
      } else {
        updatedFields[key] = {
          mode: FieldControlMode.AGENT_DECIDE,
          value: undefined,
        };
      }
    });

    setPredefinedInputs({
      ...predefinedInputs,
      fields: updatedFields,
    });

    if (mode === FieldControlMode.LEAVE_EMPTY) {
      form.setValue(propertyName, '');
    } else if (mode === FieldControlMode.AGENT_DECIDE) {
      form.setValue(propertyName, undefined);
    }

    setTimeout(() => {
      isUpdatingMode.current = false;
    }, 0);
  };

  const getCurrentMode = (propertyName: string): FieldControlMode => {
    return (
      predefinedInputs?.fields?.[propertyName]?.mode ||
      FieldControlMode.AGENT_DECIDE
    );
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-full">
        <div className="flex items-start border-b gap-3 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-sm border bg-background">
            <img
              className="size-8 object-contain"
              src={piece.logoUrl}
              alt={piece.displayName}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{action.displayName}</div>

            {action.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {action.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4 p-4">
          {pieceHasAuth && (
            <FormField
              name="auth"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <ConnectionDropdown
                    piece={selectedPiece}
                    value={field.value as string}
                    onChange={field.onChange}
                    placeholder={t('Connect your account')}
                    showError={!isNil(fieldState.error)}
                  />
                </div>
              )}
            />
          )}

          {Object.keys(props).length > 0 && (
            <div className="flex flex-col gap-4 w-full">
              {Object.entries(props).map(([propertyName, property]) => {
                const currentMode = getCurrentMode(propertyName);
                const allowEmptyValue = property.allowEmptyValue;

                return (
                  <div key={propertyName} className="space-y-2">
                    <h1 className="text-sm font-medium">
                      {property.displayName}
                    </h1>

                    <Select
                      value={currentMode}
                      onValueChange={(value: FieldControlMode) =>
                        handleFieldControlModeChange(propertyName, value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FieldControlMode.AGENT_DECIDE}>
                          {t('Let your agent generate a value for this')}
                        </SelectItem>
                        <SelectItem value={FieldControlMode.CHOOSE_YOURSELF}>
                          Choose yourself
                        </SelectItem>
                        {allowEmptyValue && (
                          <SelectItem value={FieldControlMode.LEAVE_EMPTY}>
                            Leave field empty
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {currentMode === FieldControlMode.CHOOSE_YOURSELF && (
                      <FormField
                        name={propertyName}
                        control={form.control}
                        render={({ field }) => {
                          return (
                            <div>
                              {selectGenericFormComponentForProperty({
                                field: {
                                  ...field,
                                  onChange: (value) => {
                                    field.onChange(value);
                                  },
                                },
                                hideLabel: true,
                                propertyName,
                                inputName: propertyName,
                                property: props[propertyName],
                                allowDynamicValues: false,
                                markdownVariables: {},
                                useMentionTextInput: true,
                                disabled: false,
                                dynamicInputModeToggled: false,
                                form,
                                dynamicPropsInfo: {
                                  pieceName: piece.pieceName,
                                  pieceVersion: piece.pieceVersion,
                                  actionOrTriggerName: action.name,
                                  placedInside: 'predefinedAgentInputs',
                                  updateFormSchema: null,
                                  updatePropertySettingsSchema: null,
                                },
                                propertySettings: null,
                              })}
                            </div>
                          );
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </Form>
  );
};
