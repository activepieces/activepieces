import {
  AIProviderWithoutSensitiveData,
  PlatformModelTier,
  UpdatePlatformModelTierRequest,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sortable, SortableItem } from '@/components/ui/sortable';
import {
  KeyModelsById,
  modelMeta,
} from '@/features/agents/ai-model/model-meta';
import { platformModelTierMutations } from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import { AdminModelPicker } from './admin-model-picker';
import { TierEntryRow } from './tier-entry-row';
import { tierThinking } from './tier-thinking';

export function TierCard({
  tier,
  index,
  count,
  configsById,
  ownKeys,
  keyModels,
  reducedMotion,
  onEdit,
  onDelete,
  onMove,
}: TierCardProps) {
  const { mutate: update, isPending } = platformModelTierMutations.useUpdate();
  const [error, setError] = useState<string | undefined>(undefined);
  const [mainPickerOpen, setMainPickerOpen] = useState(false);
  const [fallbackPickerOpen, setFallbackPickerOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const showSpinner = useDelayedFlag({ active: isPending, delayMs: 300 });

  const save = (request: UpdatePlatformModelTierRequest) => {
    setError(undefined);
    update(
      { id: tier.id, request },
      {
        onError: (saveError) =>
          setError(
            api.extractServerErrorMessage(
              saveError,
              t('Could not save this tier'),
            ),
          ),
      },
    );
  };

  const mainEntry = tier.entries[0];
  const mainModel =
    mainEntry === undefined
      ? undefined
      : modelMeta.catalogModel({ keyModels, entry: mainEntry });
  const rows = tier.entries.map((entry) => ({
    id: modelMeta.entryKey({ entry }),
    entry,
  }));
  const thinkingChip = tierThinking.chipLabel({
    budget: tier.thinkingBudget ?? null,
  });
  const canAddFallback = tier.entries.length < MAX_ENTRIES;

  return (
    <section
      className="flex flex-col rounded-xl border border-gray-6/60 bg-panel shadow-panel"
      aria-label={tier.name}
    >
      <header className="flex items-start gap-3 px-5 py-4">
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
              <Badge variant="secondary">{t('Default')}</Badge>
            )}
            {tier.isFast && <Badge variant="secondary">{t('Fast')}</Badge>}
            {thinkingChip !== undefined && (
              <Badge variant="outline">{thinkingChip}</Badge>
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
          {error !== undefined && (
            <p className="text-xs text-danger-11" role="alert">
              {error}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              ref={menuTriggerRef}
              variant="ghost"
              size="icon-sm"
              aria-label={t('Tier actions')}
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
            {index > 0 && (
              <DropdownMenuItem onSelect={() => onMove('up')}>
                <ArrowUp className="size-4" />
                {t('Move up')}
              </DropdownMenuItem>
            )}
            {index < count - 1 && (
              <DropdownMenuItem onSelect={() => onMove('down')}>
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
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xss font-medium uppercase tracking-wide text-gray-11">
            {t('Model & fallbacks')}
          </span>
          {tier.entries.length > 1 && (
            <span className="text-xs text-gray-10">{t('tried in order')}</span>
          )}
        </div>
        <Sortable
          value={rows}
          onMove={({ activeIndex, overIndex }) =>
            save({
              entries: modelMeta.moveEntry({
                entries: tier.entries,
                from: activeIndex,
                to: overIndex,
              }),
            })
          }
        >
          <AnimatePresence initial={false}>
            {rows.map(({ id, entry }, position) => {
              const config = configsById.get(entry.configId);
              const model = modelMeta.catalogModel({ keyModels, entry });
              const isMain = position === 0;
              return (
                <motion.div
                  key={id}
                  layout={!reducedMotion}
                  initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: 4 }}
                  transition={{ duration: 0.18 }}
                >
                  <SortableItem value={id} asChild>
                    <div>
                      <TierEntryRow
                        entry={entry}
                        index={position}
                        config={config}
                        model={model}
                        reducedMotion={reducedMotion}
                        showHandle={rows.length > 1}
                        warnings={modelMeta.warningsFor({
                          entry,
                          isMain,
                          config,
                          keyModels,
                          mainModel,
                        })}
                        trailing={
                          isMain ? (
                            <AdminModelPicker
                              configs={ownKeys}
                              keyModels={keyModels}
                              exclude={tier.entries}
                              mode="main"
                              open={mainPickerOpen}
                              onOpenChange={setMainPickerOpen}
                              onPick={(picked) =>
                                save({
                                  entries: modelMeta.replaceMain({
                                    entries: tier.entries,
                                    entry: picked,
                                  }),
                                })
                              }
                            >
                              <Button
                                variant="outline"
                                size="xs"
                                className="shrink-0"
                                aria-label={t('Change main model')}
                                {...adminControl(
                                  AdminControl.AI_TIER_MAIN_MODEL_OPEN,
                                )}
                              >
                                {t('Main model')}
                                <ChevronDown className="size-3" />
                              </Button>
                            </AdminModelPicker>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="shrink-0 text-gray-10"
                              aria-label={t('Remove {model}', {
                                model: model?.name ?? entry.modelId,
                              })}
                              onClick={() =>
                                save({
                                  entries: modelMeta.removeAt({
                                    entries: tier.entries,
                                    index: position,
                                  }),
                                })
                              }
                            >
                              <X className="size-3.5" />
                            </Button>
                          )
                        }
                        menu={
                          isMain || rows.length < 3 ? undefined : (
                            <RowMenu
                              canMoveUp={position > 1}
                              canMoveDown={position < rows.length - 1}
                              onMoveUp={() =>
                                save({
                                  entries: modelMeta.moveEntry({
                                    entries: tier.entries,
                                    from: position,
                                    to: position - 1,
                                  }),
                                })
                              }
                              onMoveDown={() =>
                                save({
                                  entries: modelMeta.moveEntry({
                                    entries: tier.entries,
                                    from: position,
                                    to: position + 1,
                                  }),
                                })
                              }
                            />
                          )
                        }
                      />
                    </div>
                  </SortableItem>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </Sortable>
        {tier.entries.length === 1 && mainEntry !== undefined && (
          <p className="px-2 pt-1 text-xs text-gray-11">
            {t('No fallbacks — this tier fails if {model} is unavailable.', {
              model: mainModel?.name ?? mainEntry.modelId,
            })}
          </p>
        )}
        <div className="px-2 pt-1">
          {canAddFallback ? (
            <AdminModelPicker
              configs={ownKeys}
              keyModels={keyModels}
              exclude={tier.entries}
              main={mainModel}
              mode="fallback"
              align="start"
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
              <Button
                variant={tier.entries.length === 1 ? 'outline' : 'ghost'}
                size="sm"
                className={cn(
                  tier.entries.length === 1 && 'border-accent-7 text-accent-11',
                )}
                {...adminControl(AdminControl.AI_TIER_FALLBACK_OPEN)}
              >
                <Plus className="size-4" />
                {t('Add fallback')}
              </Button>
            </AdminModelPicker>
          ) : (
            <p className="text-xs text-gray-10">{t('Up to 4 fallbacks')}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function RowMenu({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-gray-10"
          aria-label={t('Fallback actions')}
        >
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={!canMoveUp} onSelect={onMoveUp}>
          <ArrowUp className="size-4" />
          {t('Move up')}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canMoveDown} onSelect={onMoveDown}>
          <ArrowDown className="size-4" />
          {t('Move down')}
        </DropdownMenuItem>
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
  index: number;
  count: number;
  configsById: Map<string, AIProviderWithoutSensitiveData>;
  ownKeys: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
  reducedMotion: boolean;
  onEdit: (trigger: HTMLElement | null) => void;
  onDelete: (trigger: HTMLElement | null) => void;
  onMove: (direction: 'up' | 'down') => void;
};
