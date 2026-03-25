import {
  FlowActionType,
  FlowOperationType,
  FlowTriggerType,
  formErrors,
  isNil,
  PieceAction,
  PieceTrigger,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { piecesHooks, pieceSelectorUtils, piecesApi } from '@/features/pieces';

import { useBuilderStateContext } from '../../builder-hooks';

import { changeVersionUtils, VersionChangeType } from './change-version-utils';

const ChangeVersionDialog: React.FC<ChangeVersionDialogProps> = ({
  open,
  onOpenChange,
  step,
  currentVersion,
}) => {
  const pieceName = step.settings.pieceName;
  const actionOrTriggerName =
    step.type === FlowTriggerType.PIECE
      ? step.settings.triggerName ?? ''
      : step.settings.actionName ?? '';

  const { pieceVersions, isLoading } = piecesHooks.usePieceVersions(pieceName);
  const applyOperation = useBuilderStateContext(
    (state) => state.applyOperation,
  );

  const form = useForm<FormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: { version: currentVersion },
    mode: 'onChange',
  });

  const versionOptions = (pieceVersions ?? []).map((p) => ({
    value: p.version,
    label: p.version,
  }));

  const selectedVersion = form.watch('version');
  const versionChangeType = changeVersionUtils.getVersionChangeType({
    currentVersion,
    selectedVersion,
  });
  const isAlertfulChange =
    versionChangeType === VersionChangeType.MINOR_OR_MAJOR;

  const { mutate: applyVersionChange, isPending } = useMutation({
    mutationFn: async ({ version }: FormSchema) => {
      const piece = await piecesApi.get({ name: pieceName, version });
      const changeType = changeVersionUtils.getVersionChangeType({
        currentVersion,
        selectedVersion: version,
      });

      const actionOrTriggerDef =
        step.type === FlowTriggerType.PIECE
          ? piece.triggers[actionOrTriggerName]
          : piece.actions[actionOrTriggerName];

      if (isNil(actionOrTriggerDef)) {
        throw new Error(
          t(
            'The selected version does not include the current action or trigger. Please choose a different version.',
          ),
        );
      }

      const finalInput = changeVersionUtils.getInputAfterVersionChange({
        versionChangeType: changeType,
        props: actionOrTriggerDef.props,
        currentInput: step.settings.input,
      });

      const valid = pieceSelectorUtils.isPieceStepInputValid({
        props: actionOrTriggerDef.props,
        auth: piece.auth,
        input: finalInput,
        requireAuth: actionOrTriggerDef.requireAuth,
      });
      if (step.type === FlowTriggerType.PIECE) {
        applyOperation({
          type: FlowOperationType.UPDATE_TRIGGER,
          request: {
            ...step,
            type: FlowTriggerType.PIECE,
            valid,
            settings: {
              ...step.settings,
              pieceVersion: version,
              input: finalInput,
            },
          },
        });
      } else {
        applyOperation({
          type: FlowOperationType.UPDATE_ACTION,
          request: {
            ...step,
            type: FlowActionType.PIECE,
            valid,
            settings: {
              ...step.settings,
              pieceVersion: version,
              input: finalInput,
            },
          },
        });
      }

      if (changeType === VersionChangeType.MINOR_OR_MAJOR) {
        applyOperation({
          type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
          request: {
            stepName: step.name,
            sampleDataSettings: undefined,
          },
        });
      }
    },
    onSuccess: () => {
      onOpenChange(false);
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Change Version')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((data) => applyVersionChange(data))}
          >
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>{t('Version')}</FormLabel>
                  <SearchableSelect
                    options={versionOptions}
                    value={field.value}
                    loading={isLoading}
                    onChange={(v) => {
                      if (v) {
                        field.onChange(v);
                      }
                    }}
                    placeholder={t('Search versions...')}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAlertfulChange && (
              <Alert variant="warning">
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  {t(
                    'The step input will be reset and the step will need to be retested.',
                  )}
                </AlertDescription>
              </Alert>
            )}

            {form.formState.errors.root?.serverError && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.serverError.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={isPending}>
                {t('Apply')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { ChangeVersionDialog };

type ChangeVersionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: PieceAction | PieceTrigger;
  currentVersion: string;
};

const FormSchema = z.object({
  version: z.string().min(1, formErrors.required),
});

type FormSchema = z.infer<typeof FormSchema>;
