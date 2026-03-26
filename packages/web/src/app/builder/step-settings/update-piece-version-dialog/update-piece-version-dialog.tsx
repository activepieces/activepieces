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
import { ArrowUp, ArrowUpDown, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { piecesHooks, pieceSelectorUtils, piecesApi } from '@/features/pieces';

import { useBuilderStateContext } from '../../builder-hooks';

import {
  changeVersionUtils,
  LatestVersionAvailableAlert,
  MinorOrMajorSelectionAlert,
  PatchDowngradeInfoAlert,
  PatchUpgradeInfoAlert,
  RevertVersionBackupAlert,
  VersionChangeType,
} from './change-version-utils';

const UpdatePieceVersionDialog: React.FC<UpdatePieceVersionDialogProps> = ({
  step,
  currentVersion,
}) => {
  const [open, setOpen] = useState(false);
  const pieceName = step.settings.pieceName;
  const { pieceVersions } = piecesHooks.usePieceVersions(pieceName);
  const hasNewerVersion =
    changeVersionUtils.getLatestVersion({
      currentVersion,
      versions: pieceVersions ?? [],
    }) !== undefined;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setOpen(true)}
          >
            {hasNewerVersion ? (
              <ArrowUp className="size-3.5 text-green-500" />
            ) : (
              <ArrowUpDown className="size-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {hasNewerVersion ? t('New version available') : t('Switch version')}
        </TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Update Piece Version')}</DialogTitle>
          </DialogHeader>
          <UpdatePieceVersionForm
            key={open ? 'open' : 'closed'}
            step={step}
            currentVersion={currentVersion}
            onOpenChange={setOpen}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export { UpdatePieceVersionDialog };

type UpdatePieceVersionDialogProps = {
  step: PieceAction | PieceTrigger;
  currentVersion: string;
};

const UpdatePieceVersionForm: React.FC<UpdatePieceVersionFormProps> = ({
  step,
  currentVersion,
  onOpenChange,
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
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [versionSelectOpen, setVersionSelectOpen] = useState(false);

  const versionUpdateBackup = step.settings.versionUpdateBackup;
  const latestVersion = changeVersionUtils.getLatestVersion({
    currentVersion,
    versions: pieceVersions ?? [],
  });
  const latestVersionChangeType = latestVersion
    ? changeVersionUtils.getVersionChangeType({
        currentVersion,
        selectedVersion: latestVersion,
      })
    : undefined;
  const isLatestMinorOrMajor =
    latestVersionChangeType === VersionChangeType.MINOR_OR_MAJOR;

  const patchVersions = (pieceVersions ?? []).filter((p) => {
    const changeType = changeVersionUtils.getVersionChangeType({
      currentVersion,
      selectedVersion: p.version,
    });
    return changeType !== VersionChangeType.MINOR_OR_MAJOR;
  });

  const visibleVersions = showAllVersions ? pieceVersions ?? [] : patchVersions;

  const latestPatchVersion = patchVersions[0]?.version;

  const versionOptions = visibleVersions.map((p) => {
    const isCurrent = p.version === currentVersion;
    const isLatest =
      latestVersion !== undefined && p.version === latestVersion && !isCurrent;
    const isLatestPatch =
      latestPatchVersion !== undefined &&
      p.version === latestPatchVersion &&
      p.version !== currentVersion &&
      !isLatest;
    return {
      value: p.version,
      label: `${p.version} ${
        isCurrent
          ? `(${t('Current')})`
          : isLatest
          ? `(${t('Latest')})`
          : isLatestPatch
          ? `(${t('Latest patch')})`
          : ''
      }`,
    };
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: { version: currentVersion },
    mode: 'onChange',
  });

  const selectedVersion = form.watch('version');
  const versionChangeType = changeVersionUtils.getVersionChangeType({
    currentVersion,
    selectedVersion,
  });
  const isMinorOrMajor = versionChangeType === VersionChangeType.MINOR_OR_MAJOR;
  const isPatchDowngrade =
    versionChangeType === VersionChangeType.PATCH_DOWNGRADE;
  const isPatchUpgrade =
    versionChangeType === VersionChangeType.PATCH_UPGRADE &&
    selectedVersion !== currentVersion;

  const { mutate: applyVersionChange, isPending: isApplyPending } = useMutation(
    {
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

        const input = changeVersionUtils.getInputAfterVersionChange({
          versionChangeType: changeType,
          props: actionOrTriggerDef.props,
          currentInput: step.settings.input,
        });

        const valid = pieceSelectorUtils.isPieceStepInputValid({
          props: actionOrTriggerDef.props,
          auth: piece.auth,
          input,
          requireAuth: actionOrTriggerDef.requireAuth,
        });

        if (changeType === VersionChangeType.MINOR_OR_MAJOR) {
          applyOperation({
            type: FlowOperationType.CREATE_PIECE_VERSION_UPDATE_BACKUP,
            request: { stepName: step.name },
          });
        }

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
                input,
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
                input,
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
    },
  );

  const { mutate: revertVersionUpdate, isPending: isRevertPending } =
    useMutation({
      mutationFn: async () => {
        if (!versionUpdateBackup) return;
        const backupVersion = versionUpdateBackup.pieceVersion;
        await piecesApi.get({ name: pieceName, version: backupVersion });

        applyOperation({
          type: FlowOperationType.REVERT_PIECE_VERSION_UPDATE,
          request: { stepName: step.name },
        });
        applyOperation({
          type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
          request: {
            stepName: step.name,
            sampleDataSettings: undefined,
          },
        });
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
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => applyVersionChange(data))}
      >
        {latestVersion && (
          <LatestVersionAvailableAlert
            isLatestMinorOrMajor={isLatestMinorOrMajor}
            latestVersion={latestVersion}
            onApplyLatestVersion={applyVersionChange}
            isApplyPending={isApplyPending}
          />
        )}

        <FormField
          control={form.control}
          name="version"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('Version')}</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => {
                    setShowAllVersions((v) => !v);
                    setVersionSelectOpen(true);
                  }}
                >
                  {showAllVersions
                    ? t('Patch versions only')
                    : t('Show all versions')}
                </Button>
              </div>
              <SearchableSelect
                options={versionOptions}
                value={field.value}
                loading={isLoading}
                openState={{
                  open: versionSelectOpen,
                  setOpen: setVersionSelectOpen,
                }}
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
        {versionUpdateBackup && (
          <Collapsible className="w-full">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="group flex h-auto w-full items-center justify-between gap-2 !px-0 py-2 text-sm font-medium  hover:bg-transparent hover:text-foreground"
              >
                {t('Restore previous version')}
                <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <RevertVersionBackupAlert
                backupPieceVersion={versionUpdateBackup.pieceVersion}
                onRevert={revertVersionUpdate}
                isRevertPending={isRevertPending}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {isMinorOrMajor && <MinorOrMajorSelectionAlert />}

        {isPatchUpgrade && <PatchUpgradeInfoAlert />}

        {isPatchDowngrade && <PatchDowngradeInfoAlert />}

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
          <Button type="submit" loading={isApplyPending}>
            {t('Apply')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

type UpdatePieceVersionFormProps = {
  step: PieceAction | PieceTrigger;
  currentVersion: string;
  onOpenChange: (open: boolean) => void;
};

const FormSchema = z.object({
  version: z.string().min(1, formErrors.required),
});

type FormSchema = z.infer<typeof FormSchema>;
