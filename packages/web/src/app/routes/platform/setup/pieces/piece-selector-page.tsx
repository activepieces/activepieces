import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  apId,
  PieceSelectorConfig,
  PieceSelectorTabConfig,
  PieceSelectorTabSection,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Pin,
  Plus,
  Puzzle,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { platformApi } from '@/api/platforms-api';
import {
  AdminFetchErrorState,
  AdminPage,
  AdminPageHeader,
  ConfirmDialog,
  SaveBar,
  SettingsPanel,
  adminPageResources,
  adminSurface,
  useAdminAction,
} from '@/app/components/admin';
import { EnterpriseLockedSection } from '@/app/components/enterprise-gate';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/sortable';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { useEnterpriseGate } from '@/features/billing';
import {
  pieceSelectorCustomization,
  PIECE_SELECTOR_TAB_ICON_OPTIONS,
  piecesHooks,
  pieceCacheUtils,
  PieceSelectorTabType,
} from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import {
  PieceSelectorPreview,
  pieceSelectorPreviewUtils,
} from './piece-selector-preview';

export function PieceSelectorPage() {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const queryClient = useQueryClient();
  const canEdit = platform.plan.managePiecesEnabled;
  const gate = useEnterpriseGate({ unlocked: canEdit, featureKey: 'PIECES' });
  const savedTabs = savedTabsOf(platform.pieceSelectorConfig);
  const savedPins = platform.pinnedPieces ?? [];
  const [tabs, setTabs] = useState<PieceSelectorTabConfig[]>(savedTabs);
  const [pins, setPins] = useState<string[]>(savedPins);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [flashedKey, flashTab] = useFlash<string>();
  const [flashedPiece, flashPiece] = useFlash<string>();
  const [newTabId, setNewTabId] = useState<string | null>(null);
  const {
    pieces,
    isLoading: piecesLoading,
    isError: piecesError,
    refetch: refetchPieces,
  } = piecesHooks.usePlatformCatalog();

  const catalog: CatalogState = {
    isLoading: piecesLoading,
    isError: piecesError && pieces === undefined,
    onRetry: refetchPieces,
  };

  const togglePin = (pieceName: string) => {
    setPins((prev) =>
      prev.includes(pieceName)
        ? prev.filter((name) => name !== pieceName)
        : [...prev, pieceName],
    );
    flashPiece(pieceName);
  };

  const refreshPlatform = async () => {
    await refetch();
    pieceCacheUtils.invalidatePieceCaches(queryClient);
  };
  const save = useAdminAction<{
    pieceSelectorConfig: PieceSelectorConfig | null;
    pinnedPieces: string[];
  }>({
    verb: 'save',
    run: async (request) => {
      await platformApi.update(request, platform.id);
      await refreshPlatform();
    },
  });
  const reset = useAdminAction({
    verb: 'reset',
    name: t('Piece menu'),
    run: async () => {
      await platformApi.update({ pieceSelectorConfig: null }, platform.id);
      await refreshPlatform();
    },
    onSuccess: () => {
      setTabs(pieceSelectorCustomization.getDefaultTabConfigs());
      setPreviewKey(PieceSelectorTabType.EXPLORE);
    },
  });

  const tabsDirty = serializeTabs(tabs) !== serializeTabs(savedTabs);
  const pinsDirty = pins.join('|') !== savedPins.join('|');
  const dirty = tabsDirty || pinsDirty;
  const validationError = validateTabs(normalizeTabs(tabs));
  const hasCustomMenu = (platform.pieceSelectorConfig?.tabs.length ?? 0) > 0;

  const updateTab = (
    tab: PieceSelectorTabConfig,
    patch: Partial<PieceSelectorTabConfig>,
  ) => {
    setTabs((prev) =>
      prev.map((candidate) =>
        candidate.id === tab.id ? { ...candidate, ...patch } : candidate,
      ),
    );
    const key = pieceSelectorPreviewUtils.tabKey(tab);
    flashTab(key);
    if (patch.hidden !== true) {
      setPreviewKey(key);
    }
  };

  const removeTab = (id: string) =>
    setTabs((prev) => prev.filter((tab) => tab.id !== id));

  const addCustomTab = () => {
    const id = apId();
    setNewTabId(id);
    setPreviewKey(id);
    flashTab(id);
    setTabs((prev) => [
      ...prev,
      {
        id,
        kind: 'CUSTOM',
        title: '',
        icon: pieceSelectorCustomization.getRandomIconKey(),
        hidden: false,
        pieceNames: [],
        sections: [],
      },
    ]);
  };

  const discard = () => {
    setTabs(savedTabs);
    setPins(savedPins);
  };

  const handleSave = () => {
    if (!dirty || validationError !== null || save.isPending) {
      return;
    }
    const normalizedTabs = normalizeTabs(tabs);
    const savedSnapshot = serializeTabs(tabs);
    gate.run(() =>
      save
        .mutateAsync({
          pieceSelectorConfig: tabsDirty
            ? { tabs: normalizedTabs }
            : platform.pieceSelectorConfig ?? null,
          pinnedPieces: pins,
        })
        .then(() =>
          setTabs((current) =>
            serializeTabs(current) === savedSnapshot ? normalizedTabs : current,
          ),
        ),
    );
  };

  return (
    <AdminPage
      footer={
        <SaveBar
          dirty={dirty}
          saving={save.isPending || reset.isPending}
          disabled={validationError !== null}
          error={dirty ? validationError : null}
          onSave={handleSave}
          onDiscard={discard}
          saveControl={AdminControl.PIECES_SELECTOR_SUBMIT}
        />
      }
    >
      <AdminPageHeader
        title={t('Piece menu')}
        description={t(
          'Choose how pieces are organized when builders add a step: tabs, sections and pinned pieces.',
        )}
        resources={adminPageResources.pieces}
      />

      <EnterpriseLockedSection
        unlocked={canEdit}
        featureKey="PIECES"
        title={t('Customizing the piece menu is an Enterprise feature')}
        description={t(
          'You can try changes here. Saving them needs Enterprise.',
        )}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <SettingsPanel
          flush
          className="min-w-0 xl:sticky xl:top-6"
          title={t('What builders see')}
          description={t(
            'Click a tab, search, or point at a piece to see its actions. Pin a piece from its row. Pieces are listed as in your current project, with its piece set applied.',
          )}
        >
          <PieceSelectorPreview
            tabs={tabs}
            pins={pins}
            selectedKey={previewKey}
            onSelect={setPreviewKey}
            highlightedKeys={[hoveredKey, flashedKey].filter(
              (key): key is string => key !== null,
            )}
            flashedPiece={flashedPiece}
            onTogglePin={togglePin}
          />
        </SettingsPanel>
        <div className="flex min-w-0 flex-col gap-6">
          <SettingsPanel
            flush
            title={t('Tabs')}
            description={t(
              'Drag to reorder. Point at a tab to find it in the preview, click it to open it there.',
            )}
            action={
              <ConfirmDialog
                title={t('Reset to default?')}
                description={t(
                  'The piece menu will return to its default layout.',
                )}
                consequence={t(
                  'All your custom tabs and sections will be permanently removed.',
                )}
                confirmLabel={t('Reset')}
                controlId={AdminControl.PIECES_SELECTOR_RESET_CONFIRM}
                onConfirm={() =>
                  gate.run(() =>
                    reset.isPending ? undefined : reset.mutateAsync(),
                  )
                }
              >
                <Button
                  {...adminControl(AdminControl.PIECES_SELECTOR_RESET_OPEN)}
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={
                    (!hasCustomMenu && !tabsDirty) ||
                    reset.isPending ||
                    save.isPending
                  }
                >
                  <RotateCcw />
                  {t('Reset')}
                </Button>
              </ConfirmDialog>
            }
          >
            <div className="flex flex-col gap-3 p-5">
              <Sortable value={tabs} onValueChange={(next) => setTabs(next)}>
                <div
                  className={cn(
                    adminSurface.listFrame,
                    'flex flex-col divide-y overflow-hidden',
                    adminSurface.divider,
                  )}
                >
                  {tabs.map((tab) => (
                    <SortableItem key={tab.id} value={tab.id} asChild>
                      <div
                        onMouseEnter={() =>
                          setHoveredKey(pieceSelectorPreviewUtils.tabKey(tab))
                        }
                        onMouseLeave={() => setHoveredKey(null)}
                        onFocusCapture={() =>
                          setHoveredKey(pieceSelectorPreviewUtils.tabKey(tab))
                        }
                        onBlurCapture={() => setHoveredKey(null)}
                        onClickCapture={() => {
                          if (!tab.hidden) {
                            setPreviewKey(
                              pieceSelectorPreviewUtils.tabKey(tab),
                            );
                          }
                        }}
                      >
                        <TabCard
                          tab={tab}
                          isNew={tab.id === newTabId}
                          pieces={pieces ?? []}
                          catalog={catalog}
                          onChange={(patch) => updateTab(tab, patch)}
                          onRemove={() => removeTab(tab.id)}
                        />
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </Sortable>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={addCustomTab}
              >
                <Plus />
                {t('Add custom tab')}
              </Button>
            </div>
          </SettingsPanel>
          <PinnedPiecesPanel
            pins={pins}
            pieces={pieces ?? []}
            isLoading={piecesLoading}
            isError={piecesError && pieces === undefined}
            onRetry={refetchPieces}
            onChange={(next) => {
              setPins(next);
              setPreviewKey(PieceSelectorTabType.EXPLORE);
            }}
          />
        </div>
      </div>
    </AdminPage>
  );
}

function useFlash<T>(): [T | null, (value: T) => void] {
  const [value, setValue] = useState<T | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const flash = (next: T) => {
    window.clearTimeout(timer.current);
    setValue(next);
    timer.current = window.setTimeout(() => setValue(null), FLASH_MS);
  };
  return [value, flash];
}

function savedTabsOf(
  config: PieceSelectorConfig | null | undefined,
): PieceSelectorTabConfig[] {
  return config && config.tabs.length > 0
    ? config.tabs
    : pieceSelectorCustomization.getDefaultTabConfigs();
}

function PinnedPiecesPanel({
  pins,
  pieces,
  isLoading,
  isError,
  onRetry,
  onChange,
}: {
  pins: string[];
  pieces: PieceMetadataModelSummary[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => unknown;
  onChange: (pins: string[]) => void;
}) {
  const byName = new Map(pieces.map((piece) => [piece.name, piece]));
  const body = (() => {
    if (isError) {
      return <AdminFetchErrorState entity={t('pieces')} onRetry={onRetry} />;
    }
    if (isLoading && pins.length > 0) {
      return (
        <div className="flex flex-col gap-2">
          {pins.map((name) => (
            <Skeleton key={name} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      );
    }
    if (pins.length === 0) {
      return (
        <p className="text-sm text-gray-11">
          {t(
            'No pinned pieces. Pin the ones your builders reach for most, so they open Explore first.',
          )}
        </p>
      );
    }
    return (
      <Sortable
        value={pins.map((name) => ({ id: name }))}
        onValueChange={(next) => onChange(next.map((item) => item.id))}
      >
        <ul
          className={cn(
            adminSurface.listFrame,
            'flex flex-col divide-y overflow-hidden',
            adminSurface.divider,
          )}
        >
          {pins.map((name) => {
            const piece = byName.get(name);
            return (
              <SortableItem key={name} value={name} asChild>
                <li className="flex h-11 min-w-0 items-center gap-2 px-2 text-sm">
                  <SortableDragHandle
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('Drag to reorder')}
                  >
                    <GripVertical />
                  </SortableDragHandle>
                  <LogoPlate src={piece?.logoUrl} alt="" size="xs" border />
                  <span className="min-w-0 flex-1 truncate text-gray-12">
                    {piece?.displayName ?? t('Unavailable piece')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('Unpin {name}', {
                      name: piece?.displayName ?? name,
                    })}
                    onClick={() => onChange(pins.filter((pin) => pin !== name))}
                  >
                    <X />
                  </Button>
                </li>
              </SortableItem>
            );
          })}
        </ul>
      </Sortable>
    );
  })();
  return (
    <SettingsPanel
      flush
      title={t('Pinned pieces')}
      description={t(
        'Shown first in the Explore tab, in this order. Drag to reorder.',
      )}
    >
      <div className="flex flex-col gap-3 p-5">
        {body}
        <PiecePickerButton
          pieces={pieces}
          catalog={{ isLoading, isError, onRetry }}
          selectedPieceNames={pins}
          onChange={onChange}
          label={t('Pin pieces')}
          icon={<Pin />}
        />
      </div>
    </SettingsPanel>
  );
}

function normalizeTabs(
  tabs: PieceSelectorTabConfig[],
): PieceSelectorTabConfig[] {
  return tabs.map((tab) => {
    const trimmedTitle = (tab.title ?? '').trim();
    const sections = (tab.sections ?? [])
      .map((section) => ({ ...section, title: section.title.trim() }))
      .filter(
        (section) => section.title !== '' || section.pieceNames.length > 0,
      );
    return {
      ...tab,
      title: trimmedTitle === '' ? undefined : trimmedTitle,
      ...(tab.kind === 'CUSTOM' ? { sections } : {}),
    };
  });
}

function validateTabs(tabs: PieceSelectorTabConfig[]): string | null {
  if (tabs.some((tab) => tab.kind === 'CUSTOM' && !tab.title)) {
    return t('Custom tabs must have a name');
  }
  if (
    tabs.some((tab) =>
      (tab.sections ?? []).some((section) => section.title === ''),
    )
  ) {
    return t('Sections must have a name');
  }
  return null;
}

function serializeTabs(tabs: PieceSelectorTabConfig[]): string {
  return JSON.stringify(
    normalizeTabs(tabs).map((tab) => [
      tab.id,
      tab.kind,
      tab.builtinTab ?? null,
      tab.title ?? null,
      tab.icon ?? null,
      tab.hidden,
      tab.pieceNames ?? [],
      (tab.sections ?? []).map((section) => [
        section.id,
        section.title,
        section.pieceNames,
      ]),
    ]),
  );
}

const TabCard = ({
  tab,
  pieces,
  catalog,
  isNew,
  onChange,
  onRemove,
}: {
  tab: PieceSelectorTabConfig;
  isNew: boolean;
  pieces: PieceMetadataModelSummary[];
  catalog: CatalogState;
  onChange: (patch: Partial<PieceSelectorTabConfig>) => void;
  onRemove: () => void;
}) => {
  const [expanded, setExpanded] = useState(isNew);
  const display = pieceSelectorCustomization.getBuiltinTabDisplay(
    tab.builtinTab,
  );
  const iconNode = pieceSelectorCustomization.renderIcon(tab.icon) ??
    pieceSelectorCustomization.renderIcon(display?.defaultIconKey) ?? (
      <Puzzle className="size-5" />
    );
  const placeholder = display ? t(display.defaultLabel) : t('Tab name');
  const sections = tab.sections ?? [];
  const isCustom = tab.kind === 'CUSTOM';

  const addSection = () =>
    onChange({
      sections: [...sections, { id: apId(), title: '', pieceNames: [] }],
    });

  const updateSection = (
    sectionId: string,
    patch: Partial<PieceSelectorTabSection>,
  ) =>
    onChange({
      sections: sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    });

  const removeSection = (sectionId: string) =>
    onChange({
      sections: sections.filter((section) => section.id !== sectionId),
    });

  return (
    <div className={cn('transition-colors', expanded && 'bg-gray-2')}>
      <div
        className={cn(
          'flex h-11 items-center gap-1 px-2',
          tab.hidden && 'opacity-60',
        )}
      >
        <SortableDragHandle
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-gray-9"
          aria-label={t('Drag to reorder')}
        >
          <GripVertical />
        </SortableDragHandle>

        <TabIconPicker
          value={tab.icon}
          iconNode={iconNode}
          onChange={(icon) => onChange({ icon })}
        />

        <Input
          value={tab.title ?? ''}
          placeholder={placeholder}
          aria-label={t('Tab name')}
          autoFocus={isNew}
          onChange={(e) => onChange({ title: e.target.value })}
          className={cn(borderlessInputClass, 'flex-1 font-medium')}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-gray-11"
          onClick={() => onChange({ hidden: !tab.hidden })}
          aria-label={tab.hidden ? t('Show tab') : t('Hide tab')}
          aria-pressed={tab.hidden}
        >
          {tab.hidden ? <EyeOff /> : <Eye />}
        </Button>

        {isCustom && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-gray-11"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={t('Pieces & sections')}
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn('transition-transform', {
                'rotate-180': expanded,
              })}
            />
          </Button>
        )}
      </div>

      {isCustom && expanded && (
        <div className="flex flex-col divide-y border-t">
          <PiecesPickerRow
            label={t('Pieces')}
            hint={t('Shown at the top of the tab')}
            pieces={pieces}
            catalog={catalog}
            selectedPieceNames={tab.pieceNames ?? []}
            onChange={(pieceNames) => onChange({ pieceNames })}
          />

          <div className="flex flex-col gap-2 p-3">
            <span className="text-sm font-medium">{t('Sections')}</span>
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center gap-1.5 rounded-xl border bg-gray-1 p-1"
              >
                <Input
                  value={section.title}
                  placeholder={t('Section name')}
                  aria-label={t('Section name')}
                  onChange={(e) =>
                    updateSection(section.id, { title: e.target.value })
                  }
                  className={cn(borderlessInputClass, 'flex-1')}
                />
                <PiecePickerButton
                  pieces={pieces}
                  catalog={catalog}
                  selectedPieceNames={section.pieceNames}
                  onChange={(pieceNames) =>
                    updateSection(section.id, { pieceNames })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-gray-11"
                  onClick={() => removeSection(section.id)}
                  aria-label={t('Delete section')}
                >
                  <X />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start text-gray-11"
              onClick={addSection}
            >
              <Plus />
              {t('Add section')}
            </Button>
          </div>

          <div className="flex justify-end p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-11"
              onClick={onRemove}
            >
              <Trash2 />
              {t('Delete tab')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const PiecesPickerRow = ({
  label,
  hint,
  pieces,
  catalog,
  selectedPieceNames,
  onChange,
}: {
  label: string;
  hint: string;
  pieces: PieceMetadataModelSummary[];
  catalog: CatalogState;
  selectedPieceNames: string[];
  onChange: (pieceNames: string[]) => void;
}) => {
  return (
    <div className="flex items-center justify-between gap-2 p-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-gray-11">{hint}</span>
      </div>
      <PiecePickerButton
        pieces={pieces}
        catalog={catalog}
        selectedPieceNames={selectedPieceNames}
        onChange={onChange}
      />
    </div>
  );
};

const TabIconPicker = ({
  value,
  iconNode,
  onChange,
}: {
  value: string | undefined;
  iconNode: ReactNode;
  onChange: (icon: string) => void;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-gray-12"
          aria-label={t('Change icon')}
        >
          {iconNode}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <div className="grid grid-cols-6 gap-1 max-h-64 overflow-y-auto overflow-x-hidden">
          {PIECE_SELECTOR_TAB_ICON_OPTIONS.map(({ key, Icon }) => (
            <Button
              type="button"
              key={key}
              variant="ghost"
              size="icon"
              className={cn({
                'bg-gray-5 hover:bg-gray-5 text-accent-11 hover:text-accent-11':
                  value === key,
              })}
              onClick={() => onChange(key)}
            >
              <Icon />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const PiecePickerButton = ({
  pieces,
  catalog,
  selectedPieceNames,
  onChange,
  label,
  icon,
}: {
  pieces: PieceMetadataModelSummary[];
  catalog: CatalogState;
  selectedPieceNames: string[];
  onChange: (pieceNames: string[]) => void;
  label?: string;
  icon?: ReactNode;
}) => {
  const [query, setQuery] = useState('');
  const piecesByName = useMemo(
    () => new Map(pieces.map((piece) => [piece.name, piece])),
    [pieces],
  );
  const selected = useMemo(
    () => new Set(selectedPieceNames),
    [selectedPieceNames],
  );
  const selectedPieces = selectedPieceNames
    .map((name) => piecesByName.get(name))
    .filter((piece): piece is PieceMetadataModelSummary => !!piece);
  const needle = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      needle === ''
        ? pieces
        : pieces.filter((piece) =>
            piece.displayName.toLowerCase().includes(needle),
          ),
    [pieces, needle],
  );

  const togglePiece = (name: string) =>
    onChange(
      selected.has(name)
        ? selectedPieceNames.filter((candidate) => candidate !== name)
        : [...selectedPieceNames, name],
    );

  return (
    <Popover onOpenChange={(open) => !open && setQuery('')}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={catalog.isLoading}
          className={cn(
            'shrink-0 whitespace-nowrap font-normal',
            label !== undefined && 'self-start',
          )}
        >
          {icon}
          {label ??
            t('{count, plural, =1 {1 piece} other {# pieces}}', {
              count: selectedPieceNames.length,
            })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {selectedPieces.length > 0 && (
          <div className="border-b p-2">
            <Sortable
              value={selectedPieces.map((piece) => ({ id: piece.name }))}
              onValueChange={(items) =>
                onChange([
                  ...items.map((item) => item.id),
                  ...selectedPieceNames.filter(
                    (name) => !piecesByName.has(name),
                  ),
                ])
              }
            >
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                {selectedPieces.map((piece) => (
                  <SortableItem key={piece.name} value={piece.name} asChild>
                    <div className="flex items-center gap-2 rounded-lg px-1 py-0.5">
                      <SortableDragHandle
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-gray-9"
                        aria-label={t('Drag to reorder')}
                      >
                        <GripVertical />
                      </SortableDragHandle>
                      <LogoPlate src={piece.logoUrl} alt="" size="xs" border />
                      <span className="grow truncate text-sm">
                        {piece.displayName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0"
                        onClick={() => togglePiece(piece.name)}
                        aria-label={t('Remove {name}', {
                          name: piece.displayName,
                        })}
                      >
                        <X />
                      </Button>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </Sortable>
          </div>
        )}
        {catalog.isError ? (
          <div className="p-3">
            <AdminFetchErrorState
              entity={t('pieces')}
              onRetry={catalog.onRetry}
            />
          </div>
        ) : (
          <>
            <div className="border-b p-2">
              <Input
                type="search"
                value={query}
                placeholder={t('Search pieces')}
                aria-label={t('Search pieces')}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {matches.length === 0 ? (
              <p className="p-3 text-sm text-gray-11">{t('No pieces found')}</p>
            ) : (
              <div className="h-72 p-1">
                <VirtualizedScrollArea
                  items={matches}
                  estimateSize={() => PICKER_ROW_HEIGHT}
                  getItemKey={(index) => matches[index].name}
                  renderItem={(piece) => {
                    const isSelected = selected.has(piece.name);
                    return (
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => togglePiece(piece.name)}
                        className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-gray-3 focus-visible:outline-2 focus-visible:outline-accent-8"
                      >
                        <LogoPlate
                          src={piece.logoUrl}
                          alt=""
                          size="xs"
                          border
                        />
                        <span className="min-w-0 grow truncate">
                          {piece.displayName}
                        </span>
                        {isSelected && (
                          <Check className="size-4 shrink-0 text-accent-11" />
                        )}
                      </button>
                    );
                  }}
                />
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

const FLASH_MS = 1400;
const PICKER_ROW_HEIGHT = 36;
const borderlessInputClass =
  'border-transparent bg-transparent dark:bg-transparent shadow-none hover:border-gray-6 focus-visible:bg-gray-1';

type CatalogState = {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => unknown;
};
