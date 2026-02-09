import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type, Static } from '@sinclair/typebox';
import { t } from 'i18next';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
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
import { usePieceToolsDialogStore } from '@/features/agents/agent-tools/stores/pieces-tools';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';
import {
  FieldControlMode,
  isNil,
  PredefinedInputField,
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

type PredefinedInputsFormValues = Static<
  ReturnType<typeof createPredefinedInputsFormSchema>
>;

export const PredefinedInputsForm = () => {
  const {
    predefinedInputs,
    setPredefinedInputs,
    selectedAction,
    selectedPiece: piece,
  } = usePieceToolsDialogStore();
  const { pieces } = piecesHooks.usePieces({});
  const selectedPiece = pieces?.find((p) => p.name === piece?.pieceName);
  const requireAuth = selectedAction?.requireAuth ?? true;
  const formSchema = useMemo(
    () => createPredefinedInputsFormSchema(requireAuth),
    [requireAuth],
  );
  const properties = useMemo(
    () =>
      selectedAction
        ? Object.fromEntries(
            Object.entries(selectedAction.props).map(([name, prop]) => [
              name,
              prop as PieceProperty,
            ]),
          )
        : {},
    [selectedAction],
  );
  const defaultValues = useMemo<PredefinedInputsFormValues>(() => {
    const values: PredefinedInputsFormValues = {};
    if (requireAuth && predefinedInputs?.auth) {
      values.auth = predefinedInputs.auth;
    }
    if (predefinedInputs?.fields) {
      Object.entries(predefinedInputs.fields).forEach(([key, field]) => {
        if (
          field.mode === FieldControlMode.CHOOSE_YOURSELF &&
          !isNil(field.value)
        ) {
          values[key] = field.value;
        }
      });
    }
    return values;
  }, [predefinedInputs, requireAuth]);
  const form = useForm<PredefinedInputsFormValues>({
    resolver: typeboxResolver(formSchema),
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (!name || name === 'auth') return;

      const currentPredefined =
        usePieceToolsDialogStore.getState().predefinedInputs;

      const currentFields = currentPredefined?.fields ?? {};
      const newFields = { ...currentFields };

      if (newFields[name]?.mode === FieldControlMode.CHOOSE_YOURSELF) {
        newFields[name] = {
          ...newFields[name],
          value: values[name],
        };
      }

      setPredefinedInputs({
        ...currentPredefined,
        fields: newFields,
      });
    });

    return () => subscription.unsubscribe();
  }, [form, setPredefinedInputs]);
  const handleAuthChange = (value: string | null) => {
    const newAuth = !isNil(value) ? value : undefined;
    setPredefinedInputs({
      auth: newAuth,
      fields: predefinedInputs?.fields || {},
    });
    form.setValue('auth', value ?? '');
  };
  const getModeForProperty = (propertyName: string): FieldControlMode =>
    predefinedInputs?.fields?.[propertyName]?.mode ??
    FieldControlMode.AGENT_DECIDE;
  const handleModeChange = (
    propertyName: string,
    newMode: FieldControlMode,
  ) => {
    const currentFields = predefinedInputs?.fields ?? {};
    const prevField = currentFields[propertyName];
    const updatedField: PredefinedInputField = {
      mode: newMode,
      value:
        newMode === FieldControlMode.CHOOSE_YOURSELF
          ? prevField?.value ?? form.getValues(propertyName)
          : undefined,
    };
    setPredefinedInputs({
      ...predefinedInputs,
      fields: {
        ...currentFields,
        [propertyName]: updatedField,
      },
    });
    if (newMode === FieldControlMode.CHOOSE_YOURSELF) {
      form.setValue(propertyName, updatedField.value ?? '');
    } else {
      form.setValue(propertyName, undefined, { shouldDirty: false });
    }
  };
  const pieceHasAuth = requireAuth && selectedPiece?.auth;
  return (
    <Form {...form}>
      <ScrollArea className="h-full">
        <div className="flex items-start border-b gap-3 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-sm border bg-background">
            <img
              className="size-8 object-contain"
              src={selectedPiece?.logoUrl}
              alt={selectedPiece?.displayName}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">
              {selectedAction?.displayName}
            </div>
            {selectedAction?.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {selectedAction.description}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-6 p-4">
          {pieceHasAuth && !isNil(selectedPiece) && (
            <ConnectionDropdown
              piece={selectedPiece}
              value={form.watch('auth') as string | null}
              onChange={handleAuthChange}
              placeholder={t('Connect your account')}
            />
          )}
          {Object.keys(properties).length > 0 && (
            <div className="space-y-5">
              {Object.entries(properties).map(([propertyName, property]) => {
                const isMarkdown = property.type === PropertyType.MARKDOWN;

                if (isMarkdown) {
                  return (
                    <ApMarkdown
                      key={propertyName}
                      markdown={property.description}
                      variables={{}}
                      variant={property.variant}
                    />
                  );
                }

                const mode = getModeForProperty(propertyName);
                const showInput = mode === FieldControlMode.CHOOSE_YOURSELF;
                return (
                  <div key={propertyName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {property.displayName} {property.required && '*'}
                      </h3>
                      <Select
                        value={mode}
                        onValueChange={(v) =>
                          handleModeChange(propertyName, v as FieldControlMode)
                        }
                      >
                        <SelectTrigger className="w-80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={FieldControlMode.AGENT_DECIDE}>
                            {t('Let agent decide')}
                          </SelectItem>
                          <SelectItem value={FieldControlMode.CHOOSE_YOURSELF}>
                            {t('Set value myself')}
                          </SelectItem>
                          {!property.required && (
                            <SelectItem value={FieldControlMode.LEAVE_EMPTY}>
                              {t('Leave empty')}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {showInput && (
                      <FormField
                        name={propertyName}
                        control={form.control}
                        render={({ field }) =>
                          selectGenericFormComponentForProperty({
                            field,
                            hideLabel: true,
                            propertyName,
                            inputName: propertyName,
                            property,
                            allowDynamicValues: false,
                            markdownVariables: {},
                            useMentionTextInput: true,
                            disabled: false,
                            dynamicInputModeToggled: false,
                            form,
                            dynamicPropsInfo: {
                              pieceName: selectedPiece?.name ?? '',
                              pieceVersion: selectedPiece?.version ?? '',
                              actionOrTriggerName: selectedAction?.name ?? '',
                              placedInside: 'predefinedAgentInputs',
                              updateFormSchema: null,
                              updatePropertySettingsSchema: null,
                            },
                            propertySettings: null,
                          })
                        }
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
