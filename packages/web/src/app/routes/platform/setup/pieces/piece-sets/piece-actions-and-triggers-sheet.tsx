import {
  ActionBase,
  PieceMetadataModel,
  TriggerBase,
} from '@activepieces/pieces-framework';
import { PieceSet } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField } from '@/components/ui/form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { pieceSetMutations } from '@/features/piece-sets';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { ConfirmExcludingRequiredActionsDialog } from './confirm-excluding-required-actions';
import { ModeRadioCards } from './mode-radio-cards';
import {
  pieceActionsAndTriggersForm,
  PieceActionsAndTriggersFormSchema,
  PieceActionsAndTriggersFormValues,
  IncludeMode,
} from './piece-actions-and-triggers-form';
import { pieceSetInclusionUtils } from './piece-set-inclusion-utils';

export const PieceActionsAndTriggersSheet = ({
  pieceName,
  pieceDisplayName,
  open,
  onOpenChange,
  pieceSet,
}: PieceActionsAndTriggersSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] flex flex-col p-0">
        <PieceActionsAndTriggersSheetBody
          key={pieceName}
          pieceName={pieceName}
          pieceDisplayName={pieceDisplayName}
          pieceSet={pieceSet}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

PieceActionsAndTriggersSheet.displayName = 'PieceActionsAndTriggersSheet';

function PieceActionsAndTriggersSheetBody({
  pieceName,
  pieceDisplayName,
  pieceSet,
  onClose,
}: {
  pieceName: string;
  pieceDisplayName: string;
  pieceSet: PieceSet;
  onClose: () => void;
}) {
  const { pieceModel, isLoading, refetch } = piecesHooks.usePiece({
    name: pieceName,
  });

  return (
    <>
      <SheetHeader className="px-6 py-4 border-b shrink-0 flex-row items-center gap-3 space-y-0">
        <PieceIcon
          size="lg"
          border={true}
          displayName={pieceDisplayName}
          logoUrl={pieceModel?.logoUrl}
          showTooltip={false}
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          <SheetTitle className="text-base">{pieceDisplayName}</SheetTitle>
          <SheetDescription>
            {t('Choose which actions/triggers this set includes.')}
          </SheetDescription>
        </div>
      </SheetHeader>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-gray-11" />
        </div>
      ) : !pieceModel ? (
        <DataFetchErrorState
          entity={t('actions and triggers')}
          onRetry={refetch}
        />
      ) : (
        <PieceActionsAndTriggersEditor
          piece={pieceModel}
          pieceName={pieceName}
          pieceSet={pieceSet}
          onClose={onClose}
        />
      )}
    </>
  );
}

function PieceActionsAndTriggersEditor({
  piece,
  pieceName,
  pieceSet,
  onClose,
}: {
  piece: PieceMetadataModel;
  pieceName: string;
  pieceSet: PieceSet;
  onClose: () => void;
}) {
  const actions = Object.values(piece.actions);
  const triggers = Object.values(piece.triggers);
  const actionNames = actions.map((action) => action.name);
  const triggerNames = triggers.map((trigger) => trigger.name);
  const form = useForm<PieceActionsAndTriggersFormValues>({
    resolver: zodResolver(PieceActionsAndTriggersFormSchema),
    defaultValues: pieceActionsAndTriggersForm.buildDefaultValues({
      pieceSet,
      pieceName,
      actionNames,
      triggerNames,
    }),
    mode: 'onChange',
  });
  const [
    showRequiredActionWillBeExcludedConfirmationDialog,
    setShowRequiredActionWillBeExcludedConfirmationDialog,
  ] = useState(false);
  const { mutate: updatePieceSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();
  const values = form.watch();
  const request = pieceActionsAndTriggersForm.toUpdateRequest({
    values,
    pieceName,
  });
  const requiredActionNames =
    pieceSet.config.requiredActions.actions[pieceName] ?? [];
  const isDirty = form.formState.isDirty;

  const updateAndClose = () =>
    updatePieceSet({ id: pieceSet.id, request }, { onSuccess: onClose });

  const save = () => {
    if (
      pieceSetInclusionUtils.hasExcludedRequiredActions({ pieceSet, request })
    ) {
      setShowRequiredActionWillBeExcludedConfirmationDialog(true);
      return;
    }
    updateAndClose();
  };

  const toggleSelectAll = () => {
    const isEverythingSelected =
      values.selectedActions.length === actionNames.length &&
      values.selectedTriggers.length === triggerNames.length;
    form.setValue('selectedActions', isEverythingSelected ? [] : actionNames, {
      shouldDirty: true,
    });
    form.setValue(
      'selectedTriggers',
      isEverythingSelected ? [] : triggerNames,
      { shouldDirty: true },
    );
  };

  const isEmpty = actions.length === 0 && triggers.length === 0;
  const showCheckboxes = values.mode === 'selected';

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(save)}
          className="flex flex-1 flex-col min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <ModeCards mode={field.value} onChange={field.onChange} />
              )}
            />
            {isEmpty ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-11">
                {t('No actions or triggers found')}
              </div>
            ) : (
              <>
                {showCheckboxes && (
                  <SelectAll
                    checkedCount={
                      values.selectedActions.length +
                      values.selectedTriggers.length
                    }
                    totalCount={actionNames.length + triggerNames.length}
                    onToggle={toggleSelectAll}
                  />
                )}
                {actions.length > 0 && (
                  <FormField
                    control={form.control}
                    name="selectedActions"
                    render={({ field }) => (
                      <ComponentsSection
                        title={t('Actions')}
                        components={actions}
                        showCheckboxes={showCheckboxes}
                        checkedNames={field.value}
                        requiredNames={requiredActionNames}
                        onToggle={(name) =>
                          field.onChange(
                            pieceActionsAndTriggersForm.toggleName({
                              checkedNames: field.value,
                              allNames: actionNames,
                              name,
                            }),
                          )
                        }
                      />
                    )}
                  />
                )}
                {triggers.length > 0 && (
                  <FormField
                    control={form.control}
                    name="selectedTriggers"
                    render={({ field }) => (
                      <ComponentsSection
                        title={t('Triggers')}
                        components={triggers}
                        showCheckboxes={showCheckboxes}
                        checkedNames={field.value}
                        requiredNames={[]}
                        onToggle={(name) =>
                          field.onChange(
                            pieceActionsAndTriggersForm.toggleName({
                              checkedNames: field.value,
                              allNames: triggerNames,
                              name,
                            }),
                          )
                        }
                      />
                    )}
                  />
                )}
              </>
            )}
          </div>
          <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              {t('Cancel')}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    {...adminControl(AdminControl.PIECE_SETS_COMPONENTS_SUBMIT)}
                    type="submit"
                    disabled={!isDirty || isPending}
                    loading={isPending}
                  >
                    {t('Save changes')}
                  </Button>
                </span>
              </TooltipTrigger>
              {!isDirty && <TooltipContent>{t('No changes')}</TooltipContent>}
            </Tooltip>
          </div>
        </form>
      </Form>
      <ConfirmExcludingRequiredActionsDialog
        excludedRequiredActions={
          showRequiredActionWillBeExcludedConfirmationDialog
            ? pieceSetInclusionUtils.findExcludedRequiredActions({
                pieceSet,
                request,
              })
            : null
        }
        reason="excludeActions"
        onConfirm={() => {
          setShowRequiredActionWillBeExcludedConfirmationDialog(false);
          updateAndClose();
        }}
        onCancel={() =>
          setShowRequiredActionWillBeExcludedConfirmationDialog(false)
        }
      />
    </>
  );
}

function ModeCards({
  mode,
  onChange,
}: {
  mode: IncludeMode;
  onChange: (mode: IncludeMode) => void;
}) {
  return (
    <ModeRadioCards
      title={t('What to include in the set')}
      value={mode}
      options={[
        {
          value: 'all',
          label: t('All'),
          description: t(
            'Everything in this piece, including actions/triggers added later.',
          ),
        },
        {
          value: 'selected',
          label: t('Only selected'),
          description: t(
            'Only what you check below. New actions/triggers are not included.',
          ),
        },
      ]}
      onChange={onChange}
    />
  );
}

function SelectAll({
  checkedCount,
  totalCount,
  onToggle,
}: {
  checkedCount: number;
  totalCount: number;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <Checkbox
        checked={pieceSetInclusionUtils.determineSelectionCheckboxState({
          checkedCount,
          totalCount,
        })}
        onCheckedChange={onToggle}
      />
      <span className="text-sm font-medium">{t('Select all')}</span>
      <span className="text-sm text-gray-11">
        {t('{count} of {total} selected', {
          count: checkedCount,
          total: totalCount,
        })}
      </span>
    </label>
  );
}

function ComponentsSection({
  title,
  components,
  showCheckboxes,
  checkedNames,
  requiredNames,
  onToggle,
}: {
  title: string;
  components: (ActionBase | TriggerBase)[];
  showCheckboxes: boolean;
  checkedNames: string[];
  requiredNames: string[];
  onToggle: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold">{title}</span>
      <div className="flex flex-col gap-1 pt-2">
        {components.map((component) => (
          <ComponentRow
            key={component.name}
            component={component}
            showCheckbox={showCheckboxes}
            checked={checkedNames.includes(component.name)}
            required={requiredNames.includes(component.name)}
            onToggle={() => onToggle(component.name)}
          />
        ))}
      </div>
    </div>
  );
}

function ComponentRow({
  component,
  showCheckbox,
  checked,
  required,
  onToggle,
}: {
  component: ActionBase | TriggerBase;
  showCheckbox: boolean;
  checked: boolean;
  required: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <label
        className={cn(
          'flex flex-1 min-w-0 items-start gap-3',
          showCheckbox && 'cursor-pointer',
        )}
      >
        {showCheckbox && (
          <Checkbox
            className="mt-0.5"
            checked={checked}
            onCheckedChange={onToggle}
          />
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium">{component.displayName}</span>
          {component.description && (
            <span className="text-sm text-gray-11">
              {component.description}
            </span>
          )}
        </div>
      </label>
      {required && (
        <Badge variant="outline" className="shrink-0">
          {t('Required')}
        </Badge>
      )}
    </div>
  );
}

type PieceActionsAndTriggersSheetProps = {
  pieceName: string;
  pieceDisplayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pieceSet: PieceSet;
};
