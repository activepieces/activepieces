import { connectionTemplate, isNil } from '@activepieces/core-utils';
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';
import { FieldControlMode, PredefinedInputField } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ConnectionSelect } from '@/app/connections/connection-select';
import { ApMarkdown } from '@/components/custom/markdown';
import { Form, FormField } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePieceToolsDialogStore } from '@/features/agents';
import { appConnectionsQueries } from '@/features/connections';
import { piecesHooks } from '@/features/pieces';
import { authenticationSession } from '@/lib/authentication-session';

import { selectGenericFormComponentForProperty } from '../../piece-properties/properties-utils';

const createPredefinedInputsFormSchema = (requireAuth: boolean) =>
  requireAuth
    ? z
        .object({
          auth: z.string().min(1),
        })
        .passthrough()
    : z.object({}).passthrough();

type PredefinedInputsFormValues = z.infer<
  ReturnType<typeof createPredefinedInputsFormSchema>
>;

export const PredefinedInputsForm = () => {
  const {
    predefinedInputs,
    setPredefinedInputs,
    selectedAction,
    selectedPiece: piece,
  } = usePieceToolsDialogStore();
  const { pieces, isLoading: isLoadingPieces } = piecesHooks.usePieces({});
  const selectedPiece = pieces?.find((p) => p.name === piece?.pieceName);
  const requireAuth = selectedAction?.requireAuth ?? true;
  const { isLoading: isLoadingConnections } =
    appConnectionsQueries.useAppConnections({
      request: {
        pieceName: selectedPiece?.name ?? '',
        projectId: authenticationSession.getProjectId()!,
        limit: 1000,
      },
      pieceAuth: selectedPiece?.auth,
      extraKeys: [selectedPiece?.name, authenticationSession.getProjectId()!],
      staleTime: 0,
      enabled: requireAuth && !isNil(selectedPiece?.auth),
    });
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
    const auth = connectionTemplate.wrapExternalId(predefinedInputs?.auth);
    if (requireAuth && !isNil(auth)) {
      values.auth = auth;
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
    resolver: zodResolver(formSchema),
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
  const handleAuthChange = (value: string) => {
    setPredefinedInputs({
      auth: connectionTemplate.unwrapExternalId(value) ?? undefined,
      fields: predefinedInputs?.fields || {},
    });
    form.setValue('auth', value);
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
  if (isLoadingPieces || isLoadingConnections) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="w-full h-10" />
        ))}
      </div>
    );
  }
  return (
    <Form {...form}>
      <ScrollArea className="h-full">
        {pieceHasAuth && !isNil(selectedPiece) && (
          <div className="flex flex-col gap-2 p-4 border-b">
            <Label showRequiredIndicator>{t('Connection')}</Label>
            <ConnectionSelect
              piece={selectedPiece}
              value={
                connectionTemplate.wrapExternalId(form.watch('auth')) ??
                undefined
              }
              onChange={handleAuthChange}
            />
          </div>
        )}
        {Object.keys(properties).length > 0 && (
          <div className="flex flex-col gap-3 p-4">
            <span className="text-xs text-gray-11">{t('Inputs')}</span>
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
                    <Label showRequiredIndicator={property.required}>
                      {property.displayName}
                    </Label>
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
      </ScrollArea>
    </Form>
  );
};
