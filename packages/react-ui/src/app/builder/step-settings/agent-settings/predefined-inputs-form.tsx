import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type, Static } from '@sinclair/typebox';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
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
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';
import { ActionBase, PieceProperty } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

import { ConnectionDropdown } from '../../../../features/agents/agent-tools/piece-tool-dialog/connection-select';
import { useAgentToolsStore } from '../../../../features/agents/agent-tools/store';
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

type FieldControlMode = 'agent-decide' | 'choose-yourself' | 'leave-empty';

export const PredefinedInputsForm = ({
  action,
  piece,
}: PredefinedInputsPropsForm) => {
  const { predefinedInputs, setPredefinedInputs } = useAgentToolsStore();

  const { pieces } = piecesHooks.usePieces({});
  const selectedPiece = pieces?.find((p) => p.name === piece.pieceName);

  const pieceHasAuth =
    !isNil(selectedPiece) && !isNil(selectedPiece.auth) && action.requireAuth;

  const formSchema = useMemo(
    () => createPredefinedInputsFormSchema(pieceHasAuth),
    [pieceHasAuth],
  );
  type PredefinedInputsForm = Static<typeof formSchema>;

  const form = useForm<PredefinedInputsForm>({
    mode: 'all',
    reValidateMode: 'onChange',
    resolver: typeboxResolver(formSchema),
    defaultValues: predefinedInputs,
  });

  const [fieldControlModes, setFieldControlModes] = useState<
    Record<string, FieldControlMode>
  >({});

  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (pieceHasAuth && name !== 'auth') {
        form.trigger('auth');
      }

      const { auth, ...values } = form.getValues();
      const cleaned: Record<string, unknown> = {};

      if (!isNil(auth)) {
        cleaned.auth = auth;
      }

      for (const key in values) {
        const value = values[key];
        const mode = fieldControlModes[key];

        if (mode === 'agent-decide') {
          continue;
        } else if (mode === 'choose-yourself') {
          if (!isNil(value)) {
            cleaned[key] = value;
          }
        } else if (mode === 'leave-empty') {
          cleaned[key] = undefined;
        }
      }

      setPredefinedInputs(cleaned);
    });

    return () => subscription.unsubscribe();
  }, [form, setPredefinedInputs, pieceHasAuth, fieldControlModes]);

  const props = Object.fromEntries(
    Object.entries(action.props).map(([propertyName, property]) => [
      propertyName,
      {
        ...property,
        allowEmptyValue: !property.required,
        required: false,
      } as PieceProperty & { allowEmptyValue: boolean },
    ]),
  );

  const handleFieldControlModeChange = (
    propertyName: string,
    mode: FieldControlMode,
  ) => {
    setFieldControlModes((prev) => ({ ...prev, [propertyName]: mode }));

    if (mode === 'agent-decide') {
      form.setValue(propertyName, undefined);
    } else if (mode === 'leave-empty') {
      form.setValue(propertyName, null);
    }
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
                const currentMode =
                  fieldControlModes[propertyName] || 'agent-decide';
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
                        <SelectItem value="agent-decide">
                          {t('Let your agent generate a value for this')}
                        </SelectItem>
                        <SelectItem value="choose-yourself">
                          Choose yourself
                        </SelectItem>
                        {allowEmptyValue && (
                          <SelectItem value="leave-empty">
                            Leave field empty
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {currentMode === 'choose-yourself' && (
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
