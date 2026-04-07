import { formErrors, PieceAction, PieceTrigger } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowUp, ArrowUpDown } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
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
import { piecesHooks } from '@/features/pieces';

import { useBuilderStateContext } from '../../builder-hooks';

import {
  changeVersionUtils,
  MinorOrMajorSelectionAlert,
  PatchDowngradeInfoAlert,
  PatchUpgradeInfoAlert,
  VersionChangeType,
} from './update-piece-version-utils';
import { UpgradePieceVersionContent } from './upgrade-piece-version-dialog';

type DialogView = 'upgrade' | 'advanced';

const UpdatePieceVersionDialog: React.FC<UpdatePieceVersionDialogProps> = ({
  step,
  currentVersion,
}) => {
  const [view, setView] = useState<DialogView | null>(null);
  const pieceName = step.settings.pieceName;
  const { pieceVersions, isLoading } = piecesHooks.usePieceVersions(pieceName);
  const latestVersion = changeVersionUtils.getLatestVersion({
    currentVersion,
    versions: pieceVersions ?? [],
  });
  const hasNewerVersion = latestVersion !== undefined;
  const isLatestMinorOrMajor =
    latestVersion !== undefined &&
    changeVersionUtils.getVersionChangeType({
      currentVersion,
      selectedVersion: latestVersion,
    }) === VersionChangeType.MINOR_OR_MAJOR;

  const handleOpen = () => {
    setView(hasNewerVersion ? 'upgrade' : 'advanced');
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={handleOpen}
            loading={isLoading}
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

      <Dialog
        open={view !== null}
        onOpenChange={(open) => !open && setView(null)}
      >
        <DialogContent>
          <DialogHeader className="mb-0">
            <DialogTitle>
              {view === 'upgrade'
                ? t('New Version Available')
                : t('Update Piece Version')}
            </DialogTitle>
          </DialogHeader>
          {view === 'upgrade' && latestVersion && (
            <UpgradePieceVersionContent
              key="upgrade"
              step={step}
              currentVersion={currentVersion}
              latestVersion={latestVersion}
              isLatestMinorOrMajor={isLatestMinorOrMajor}
              onClose={() => setView(null)}
              onOpenAdvanced={() => setView('advanced')}
            />
          )}
          {view === 'advanced' && (
            <AdvancedForm
              key="advanced"
              step={step}
              currentVersion={currentVersion}
              onClose={() => setView(null)}
              onBack={hasNewerVersion ? () => setView('upgrade') : undefined}
            />
          )}
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

const AdvancedForm: React.FC<AdvancedFormProps> = ({
  step,
  currentVersion,
  onClose,
  onBack,
}) => {
  const pieceName = step.settings.pieceName;

  const { pieceVersions, isLoading } = piecesHooks.usePieceVersions(pieceName);
  const applyOperation = useBuilderStateContext(
    (state) => state.applyOperation,
  );
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [versionSelectOpen, setVersionSelectOpen] = useState(false);

  const patchVersions = (pieceVersions ?? []).filter((p) => {
    const changeType = changeVersionUtils.getVersionChangeType({
      currentVersion,
      selectedVersion: p.version,
    });
    return changeType !== VersionChangeType.MINOR_OR_MAJOR;
  });

  const visibleVersions = showAllVersions ? pieceVersions ?? [] : patchVersions;

  const latestVersion = changeVersionUtils.getLatestVersion({
    currentVersion,
    versions: pieceVersions ?? [],
  });
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
        await changeVersionUtils.applyPieceVersionChange({
          step,
          targetVersion: version,
          currentVersion,
          applyOperation,
        });
      },
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        form.setError('root.serverError', {
          type: 'manual',
          message: error.message,
        });
      },
    },
  );

  return (
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

        {isMinorOrMajor && <MinorOrMajorSelectionAlert />}

        {isPatchUpgrade && <PatchUpgradeInfoAlert />}

        {isPatchDowngrade && <PatchDowngradeInfoAlert />}

        {form.formState.errors.root?.serverError && (
          <p className="text-sm font-medium text-destructive">
            {form.formState.errors.root.serverError.message}
          </p>
        )}

        <DialogFooter>
          {onBack && (
            <Button
              type="button"
              variant="outline"
              className="mr-auto"
              onClick={onBack}
            >
              {t('Back')}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            loading={isApplyPending}
            disabled={selectedVersion === currentVersion}
          >
            {t('Apply')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

type AdvancedFormProps = {
  step: PieceAction | PieceTrigger;
  currentVersion: string;
  onClose: () => void;
  onBack?: () => void;
};

const FormSchema = z.object({
  version: z.string().min(1, formErrors.required),
});

type FormSchema = z.infer<typeof FormSchema>;
