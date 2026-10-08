import {
  AIProviderWithoutSensitiveData,
  PlatformModelTier,
  PlatformModelTierEntry,
  UpdatePlatformModelTierRequest,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowDown,
  ArrowUp,
  Brain,
  Info,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Replace,
  Star,
  Trash2,
  TriangleAlert,
  Zap,
  LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  KeyModelsById,
  modelMeta,
  ToolsVerdict,
} from '@/features/agents/ai-model/model-meta';
import { platformModelTierMutations } from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { AdminModelPicker } from './admin-model-picker';
import { TierEntryRow } from './tier-entry-row';
import { tierThinking } from './tier-thinking';

export function TierCard({
  tier,
  configsById,
  ownKeys,
  keyModels,
  projectIds,
  previewProjectId,
  reducedMotion,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: TierCardProps) {
  const { mutate: update, isPending } = platformModelTierMutations.useUpdate();
  const [mainPickerOpen, setMainPickerOpen] = useState(false);
  const [fallbackPickerOpen, setFallbackPickerOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const showSpinner = useDelayedFlag({ active: isPending, delayMs: 300 });

  const save = (request: UpdatePlatformModelTierRequest) =>
    update({ id: tier.id, request });
  const move = ({ from, to }: { from: number; to: number }) =>
    save({ entries: modelMeta.moveEntry({ entries: tier.entries, from, to }) });

  const mainEntry = tier.entries[0];
  const mainModel =
    mainEntry === undefined
      ? undefined
      : modelMeta.catalogModel({ keyModels, entry: mainEntry });
  const thinkingChip = tierThinking.chipLabel({
    budget: tier.thinkingBudget ?? null,
  });
  const tools = modelMeta.toolsVerdict({
    config:
      mainEntry === undefined ? undefined : configsById.get(mainEntry.configId),
    entry: mainEntry,
    model: mainModel,
  });
  const notices = cardNotices({
    tier,
    configsById,
    keyModels,
    projectIds,
    previewProjectId,
    tools,
    mainName: mainModel?.name ?? mainEntry?.modelId ?? '',
  });
  const unavailableHere =
    previewProjectId !== null &&
    modelMeta.tierReach({
      tier,
      configsById,
      projectIds: [previewProjectId],
    }).unavailableCount === 1;
  const canAddFallback = tier.entries.length < MAX_ENTRIES;
  const noFallbacks = tier.entries.length === 1;
  const fallbackPicker = (trigger: ReactNode) => (
    <AdminModelPicker
      configs={ownKeys}
      keyModels={keyModels}
      exclude={tier.entries}
      main={mainModel}
      mode="fallback"
      align="end"
      open={fallbackPickerOpen}
      onOpenChange={setFallbackPickerOpen}
      onPick={(picked) =>
        save({
          entries: modelMeta.addFallback({
            entries: tier.entries,
            entry: picked,
          }),
        })
      }
    >
      {trigger}
    </AdminModelPicker>
  );

  return (
    <section
      className={cn(
        'flex flex-col rounded-xl border border-gray-6/60 bg-panel shadow-panel transition-opacity',
        unavailableHere && 'opacity-60',
      )}
      aria-label={tier.name}
    >
      <header className="flex items-center gap-3 px-5 py-4">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-3 text-xl"
          aria-hidden="true"
        >
          {tier.emoji}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <TextWithTooltip tooltipMessage={tier.name}>
              <h3 className="truncate text-sm font-semibold">{tier.name}</h3>
            </TextWithTooltip>
            {tier.isDefault && (
              <TierTag
                icon={Star}
                className="border-accent-6 bg-accent-3 text-accent-11"
              >
                {t('Default')}
              </TierTag>
            )}
            {tier.isFast && (
              <TierTag
                icon={Zap}
                className="border-warning-7 bg-warning-3 text-warning-11"
              >
                {t('Fast')}
              </TierTag>
            )}
            {thinkingChip !== undefined && (
              <TierTag icon={Brain}>{thinkingChip}</TierTag>
            )}
            {tools === 'recommended' && (
              <TierTag icon={MessageSquare}>
                {t('Recommended for chat')}
              </TierTag>
            )}
            {showSpinner && (
              <Loader2
                className="size-3.5 animate-spin text-gray-10"
                aria-label={t('Saving')}
              />
            )}
          </div>
          {tier.description && (
            <p className="truncate text-xs text-gray-11">{tier.description}</p>
          )}
          {notices.length > 0 && (
            <ul className="flex flex-col gap-0.5 pt-1">
              {notices.map((notice) => (
                <li
                  key={notice}
                  className="flex items-start gap-1.5 text-xs text-warning-11"
                >
                  <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                  <span>{notice}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              ref={menuTriggerRef}
              variant="ghost"
              size="icon-sm"
              aria-label={t('Tier actions')}
              disabled={isPending}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <DropdownMenuItem
              onSelect={() => onEdit(menuTriggerRef.current)}
              {...adminControl(AdminControl.AI_TIER_OPEN)}
            >
              <Pencil className="size-4" />
              {t('Edit')}
            </DropdownMenuItem>
            {!tier.isDefault && (
              <DropdownMenuItem
                onSelect={() => save({ isDefault: true })}
                {...adminControl(AdminControl.AI_TIER_DEFAULT_SELECT)}
              >
                <Star className="size-4" />
                {t('Make default')}
              </DropdownMenuItem>
            )}
            {!tier.isFast && (
              <DropdownMenuItem
                onSelect={() => save({ isFast: true })}
                {...adminControl(AdminControl.AI_TIER_FAST_SELECT)}
              >
                <Zap className="size-4" />
                {t('Use as fast model')}
              </DropdownMenuItem>
            )}
            {onMoveUp !== undefined && (
              <DropdownMenuItem onSelect={onMoveUp}>
                <ArrowUp className="size-4" />
                {t('Move up')}
              </DropdownMenuItem>
            )}
            {onMoveDown !== undefined && (
              <DropdownMenuItem onSelect={onMoveDown}>
                <ArrowDown className="size-4" />
                {t('Move down')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger-11"
              onSelect={() => onDelete(menuTriggerRef.current)}
              {...adminControl(AdminControl.AI_TIER_DELETE_OPEN)}
            >
              <Trash2 className="size-4" />
              {t('Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-col gap-1 border-t border-gray-6/60 px-3 pb-3 pt-3">
        <div className="flex items-center gap-1.5 px-2 pb-1">
          <span className="text-xss font-medium uppercase tracking-wide text-gray-11">
            {t('Model & fallbacks')}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex text-gray-10" tabIndex={0}>
                <Info className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {t(
                'Fallbacks are tried in this order when the main model fails.',
              )}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-col">
          <AnimatePresence initial={false}>
            {tier.entries.map((entry, position) => {
              const config = configsById.get(entry.configId);
              const model = modelMeta.catalogModel({ keyModels, entry });
              const isMain = position === 0;
              const last = !noFallbacks && position === tier.entries.length - 1;
              const row = (
                <TierEntryRow
                  entry={entry}
                  index={position}
                  isLast={last}
                  config={config}
                  model={model}
                  loading={keyModels[entry.configId]?.isLoading === true}
                  skipped={
                    previewProjectId !== null &&
                    !isMain &&
                    !unavailableHere &&
                    !modelMeta.entryRunsIn({
                      entry,
                      config,
                      projectId: previewProjectId,
                    })
                  }
                  warnings={modelMeta.warningsFor({
                    entry,
                    isMain,
                    config,
                    keyModels,
                    mainModel,
                  })}
                  menu={
                    <RowMenu
                      isMain={isMain}
                      disabled={isPending}
                      canMoveUp={position > 0}
                      canMoveDown={position < tier.entries.length - 1}
                      onChangeMain={() => setMainPickerOpen(true)}
                      onMoveUp={() =>
                        move({ from: position, to: position - 1 })
                      }
                      onMoveDown={() =>
                        move({ from: position, to: position + 1 })
                      }
                      onRemove={() =>
                        save({
                          entries: modelMeta.removeAt({
                            entries: tier.entries,
                            index: position,
                          }),
                        })
                      }
                    />
                  }
                />
              );
              return (
                <motion.div
                  key={modelMeta.entryKey({ entry })}
                  layout={!reducedMotion}
                  initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: 4 }}
                  transition={{ duration: 0.18 }}
                >
                  {isMain ? (
                    <AdminModelPicker
                      configs={ownKeys}
                      keyModels={keyModels}
                      exclude={tier.entries}
                      mode="main"
                      anchorOnly
                      open={mainPickerOpen}
                      onOpenChange={setMainPickerOpen}
                      onPick={(picked: PlatformModelTierEntry) =>
                        save({
                          entries: modelMeta.replaceMain({
                            entries: tier.entries,
                            entry: picked,
                          }),
                        })
                      }
                    >
                      <div>{row}</div>
                    </AdminModelPicker>
                  ) : (
                    row
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {noFallbacks ? (
          <div className="flex items-stretch gap-3 px-2">
            <div className="flex w-4 shrink-0 flex-col items-center">
              <span className="w-px flex-1 bg-gray-6" />
              <span className="my-1 size-2 shrink-0 rounded-full border-2 border-gray-7 bg-panel" />
              <span className="w-px flex-1" />
            </div>
            <div className="my-1 flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg border border-dashed border-gray-7 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm font-medium text-gray-11">
                  {t('No fallback model')}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-gray-10" tabIndex={0}>
                      <Info className="size-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    {t(
                      'A fallback is tried when the main model fails. Without one, this tier fails if {model} is unavailable.',
                      { model: mainModel?.name ?? mainEntry?.modelId ?? '' },
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
              {fallbackPicker(
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={isPending}
                  {...adminControl(AdminControl.AI_TIER_FALLBACK_OPEN)}
                >
                  <Plus className="size-4" />
                  {t('Add fallback')}
                </Button>,
              )}
            </div>
          </div>
        ) : (
          <div className="px-2 pt-1">
            {canAddFallback ? (
              fallbackPicker(
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-11"
                  disabled={isPending}
                  {...adminControl(AdminControl.AI_TIER_FALLBACK_OPEN)}
                >
                  <Plus className="size-4" />
                  {t('Add fallback')}
                </Button>,
              )
            ) : (
              <p className="px-2 text-xs text-gray-10">
                {t('Up to 4 fallbacks')}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function cardNotices({
  tier,
  configsById,
  keyModels,
  projectIds,
  previewProjectId,
  tools,
  mainName,
}: {
  tier: PlatformModelTier;
  configsById: Map<string, AIProviderWithoutSensitiveData>;
  keyModels: KeyModelsById;
  projectIds: string[];
  previewProjectId: string | null;
  tools: ToolsVerdict;
  mainName: string;
}): string[] {
  const noTools =
    tools === 'noTools'
      ? [
          t("Not offered in chat or agents — {model} can't call tools", {
            model: mainName,
          }),
        ]
      : [];
  if (previewProjectId !== null) {
    const here = modelMeta.tierReach({
      tier,
      configsById,
      projectIds: [previewProjectId],
    });
    return here.unavailableCount === 1
      ? [
          t(
            "Not available in this project — its main model's key doesn't serve it",
          ),
        ]
      : noTools;
  }
  const reach = modelMeta.tierReach({ tier, configsById, projectIds });
  const unavailable =
    reach.unavailableCount > 0
      ? [t('tierUnavailableInProjects', { count: reach.unavailableCount })]
      : [];
  const skipped = reach.skippedFallbacks.map(({ entry, projectCount }) =>
    t('fallbackSkippedInProjects', {
      model:
        modelMeta.catalogModel({ keyModels, entry })?.name ?? entry.modelId,
      count: projectCount,
    }),
  );
  return [...unavailable, ...skipped, ...noTools];
}

function TierTag({
  icon: Icon,
  className,
  children,
}: {
  icon: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-gray-6 bg-gray-2 px-2 py-0.5 text-xs font-medium text-gray-11',
        className,
      )}
    >
      <Icon className="size-3 fill-current" />
      {children}
    </span>
  );
}

function RowMenu({
  isMain,
  disabled,
  canMoveUp,
  canMoveDown,
  onChangeMain,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  isMain: boolean;
  disabled: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChangeMain: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-gray-10"
          aria-label={t('Model actions')}
          disabled={disabled}
        >
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {isMain && (
          <DropdownMenuItem
            onSelect={onChangeMain}
            {...adminControl(AdminControl.AI_TIER_MAIN_MODEL_OPEN)}
          >
            <Replace className="size-4" />
            {t('Change main model')}
          </DropdownMenuItem>
        )}
        {canMoveUp && (
          <DropdownMenuItem onSelect={onMoveUp}>
            <ArrowUp className="size-4" />
            {t('Move up')}
          </DropdownMenuItem>
        )}
        {canMoveDown && (
          <DropdownMenuItem onSelect={onMoveDown}>
            <ArrowDown className="size-4" />
            {t('Move down')}
          </DropdownMenuItem>
        )}
        {!isMain && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger-11" onSelect={onRemove}>
              <Trash2 className="size-4" />
              {t('Remove')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useDelayedFlag({
  active,
  delayMs,
}: {
  active: boolean;
  delayMs: number;
}): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = window.setTimeout(() => setShown(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [active, delayMs]);
  return shown;
}

const MAX_ENTRIES = 5;

type TierCardProps = {
  tier: PlatformModelTier;
  configsById: Map<string, AIProviderWithoutSensitiveData>;
  ownKeys: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
  projectIds: string[];
  previewProjectId: string | null;
  reducedMotion: boolean;
  onEdit: (trigger: HTMLElement | null) => void;
  onDelete: (trigger: HTMLElement | null) => void;
  onMoveUp: (() => void) | undefined;
  onMoveDown: (() => void) | undefined;
};
