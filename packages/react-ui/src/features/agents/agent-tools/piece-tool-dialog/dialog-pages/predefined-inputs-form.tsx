import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type, Static } from '@sinclair/typebox';
import { t } from 'i18next';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

// eslint-disable-next-line import/no-restricted-paths
import { selectGenericFormComponentForProperty } from '@/app/builder/piece-properties/properties-utils';
import { Form, FormField } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';
import { ActionBase, PieceProperty } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

import { useAgentToolsStore } from '../../store';
import { ConnectionDropdown } from '../connection-select';

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

  const { pieces } = piecesHooks.usePieces({});
  const selectedPiece = pieces?.find((p) => p.name === piece.pieceName);

  const pieceHasAuth =
    !!selectedPiece && !isNil(selectedPiece.auth) && action.requireAuth;

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

  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (pieceHasAuth && name !== 'auth') {
        form.trigger('auth');
      }

      const values = form.getValues();
      const cleaned: Record<string, unknown> = {};

      for (const key in values) {
        const value = values[key];
        if (isNil(value)) continue;
        cleaned[key] = value;
      }

      setPredefinedInputs(cleaned);
    });

    return () => subscription.unsubscribe();
  }, [form, setPredefinedInputs, pieceHasAuth]);

  return (
    <Form {...form}>
      <ScrollArea className="h-full">
        <div className="flex items-start border-b gap-3 p-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-sm border bg-background">
            <img
              className="size-8 rounded-full"
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

          {Object.entries(action.props).map(([propertyName, property]) => (
            <FormField
              key={propertyName}
              name={propertyName}
              control={form.control}
              render={({ field }) =>
                selectGenericFormComponentForProperty({
                  field,
                  allowDynamicValues: false,
                  dynamicInputModeToggled: false,
                  markdownVariables: {},
                  propertyName,
                  inputName: propertyName,
                  property: { ...property, required: false } as PieceProperty,
                  useMentionTextInput: false,
                  disabled: false,
                  form,
                  actionOrTriggerName: action.name,
                  pieceName: piece.pieceName,
                  pieceVersion: piece.pieceVersion,
                  inputPrefix: undefined,
                })
              }
            />
          ))}
        </div>
      </ScrollArea>
    </Form>
  );
};
