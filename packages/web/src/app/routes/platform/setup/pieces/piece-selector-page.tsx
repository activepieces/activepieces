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
  MoreHorizontal,
  Pin,
  Plus,
  Puzzle,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';

import { platformApi } from '@/api/platforms-api';
import {
  AdminPage,
  AdminPageHeader,
  SaveBar,
  SettingsPanel,
  adminPageResources,
  useAdminAction,
} from '@/app/components/admin';
import { EnterpriseLockedSection } from '@/app/components/enterprise-gate';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/sortable';
import { useEnterpriseGate } from '@/features/billing';
import {
  PieceIcon,
  pieceSelectorCustomization,
  PIECE_SELECTOR_TAB_ICON_OPTIONS,
  piecesHooks,
  pieceCacheUtils,
} from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

const borderlessInputClass =
  'border-transparent bg-transparent dark:bg-transparent shadow-none hover:border-gray-6 focus-visible:bg-gray-1';

export function PieceSelectorPage() {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const queryClient = useQueryClient();
  const canEdit = platform.plan.managePiecesEnabled;
  const gate = useEnterpriseGate({ unlocked: canEdit, featureKey: 'PIECES' });
  const hasCustomMenu = (platform.pieceSelectorConfig?.tabs.length ?? 0) > 0;
  const savedTabs = hasCustomMenu
    ? platform.pieceSelectorConfig?.tabs ?? []
    : pieceSelectorCustomization.getDefaultTabConfigs();
  const savedPins = platform.pinnedPieces ?? [];
  const [tabs, setDraftTabs] = useState<PieceSelectorTabConfig[]>(savedTabs);
  const [pins, setPins] = useState<string[]>(savedPins);
  const [previewTabId, setPreviewTabId] = useState<string | null>(null);
  const [newTabId, setNewTabId] = useState<string | null>(null);
  const { pieces } = piecesHooks.usePieces({
    includeHidden: true,
    skipProjectFilter: true,
  });

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

  const tabsDirty = serializeTabs(tabs) !== serializeTabs(savedTabs);
  const pinsDirty = pins.join('|') !== savedPins.join('|');
  const dirty = tabsDirty || pinsDirty;
  const validationError = validateTabs(normalizeTabs(tabs));

  const setTabs = (
    update: (prev: PieceSelectorTabConfig[]) => PieceSelectorTabConfig[],
  ) => setDraftTabs(update);

  const updateTab = (id: string, patch: Partial<PieceSelectorTabConfig>) =>
    setTabs((prev) =>
      prev.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab)),
    );

  const removeTab = (id: string) =>
    setTabs((prev) => prev.filter((tab) => tab.id !== id));

  const addCustomTab = () => {
    const id = apId();
    setNewTabId(id);
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
    setDraftTabs(savedTabs);
    setPins(savedPins);
  };

  const handleSave = () => {
    if (!dirty || validationError !== null || save.isPending) {
      return;
    }
    const normalizedTabs = normalizeTabs(tabs);
    gate.run(() =>
      save
        .mutateAsync({
          pieceSelectorConfig: tabsDirty
            ? { tabs: normalizedTabs }
            : platform.pieceSelectorConfig ?? null,
          pinnedPieces: pins,
        })
        .then(() => setDraftTabs(normalizedTabs)),
    );
  };

  const resetToDefault = () => {
    setDraftTabs(pieceSelectorCustomization.getDefaultTabConfigs());
  };

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
    >
      <AdminPage
        footer={
          <SaveBar
            dirty={dirty}
            saving={save.isPending}
            disabled={validationError !== null}
            error={dirty ? validationError : null}
            onDiscard={discard}
            saveControl={AdminControl.PIECES_SELECTOR_SUBMIT}
          />
        }
      >
        <AdminPageHeader
          title={t('Piece selector')}
          description={t(
            'Arrange what builders see when they add a step: the tabs, the pieces in custom tabs, and the pinned pieces at the top of Explore.',
          )}
          resources={adminPageResources.pieces}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                {...adminControl(AdminControl.PIECES_SELECTOR_RESET_OPEN)}
                type="button"
                variant="outline"
                size="icon"
                aria-label={t('More actions')}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                {...adminControl(AdminControl.PIECES_SELECTOR_RESET_CONFIRM)}
                onSelect={resetToDefault}
              >
                <RotateCcw />
                {t('Reset tabs to default')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </AdminPageHeader>

        <EnterpriseLockedSection
          unlocked={canEdit}
          featureKey="PIECES"
          title={t('Customizing the piece selector is an Enterprise feature')}
          description={t(
            'You can try changes here. Saving them needs Enterprise.',
          )}
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-6">
            <SettingsPanel
              flush
              title={t('Tabs')}
              description={t(
                'Drag to reorder. Rename a tab, give it an icon, or hide it. Custom tabs hold the pieces you pick, in sections.',
              )}
            >
              <div className="flex flex-col gap-2 p-5">
                <Sortable
                  value={tabs}
                  onValueChange={(next) => setTabs(() => next)}
                >
                  <div className="flex flex-col gap-2">
                    {tabs.map((tab) => (
                      <SortableItem key={tab.id} value={tab.id} asChild>
                        <div>
                          <TabCard
                            tab={tab}
                            isNew={tab.id === newTabId}
                            pieces={pieces ?? []}
                            onChange={(patch) => updateTab(tab.id, patch)}
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
              onChange={setPins}
            />
          </div>
          <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-6">
            <MenuPreview
              tabs={tabs}
              pins={pins}
              pieces={pieces ?? []}
              selectedId={previewTabId}
              onSelect={setPreviewTabId}
            />
          </aside>
        </div>
      </AdminPage>
    </form>
  );
}

function PinnedPiecesPanel({
  pins,
  pieces,
  onChange,
}: {
  pins: string[];
  pieces: PieceMetadataModelSummary[];
  onChange: (pins: string[]) => void;
}) {
  const byName = new Map(pieces.map((piece) => [piece.name, piece]));
  return (
    <SettingsPanel
      flush
      title={t('Pinned pieces')}
      description={t(
        'Shown first in the Explore tab, in this order. Drag to reorder.',
      )}
    >
      <div className="flex flex-col gap-2 p-5">
        {pins.length === 0 ? (
          <p className="text-sm text-gray-11">
            {t(
              'No pinned pieces. Pin the ones your builders reach for most, so they open Explore first.',
            )}
          </p>
        ) : (
          <Sortable
            value={pins.map((name) => ({ id: name }))}
            onValueChange={(next) => onChange(next.map((item) => item.id))}
          >
            <ul className="flex flex-col gap-1.5">
              {pins.map((name) => {
                const piece = byName.get(name);
                return (
                  <SortableItem key={name} value={name} asChild>
                    <li className="flex h-10 min-w-0 items-center gap-2 rounded-lg border bg-(--admin-surface) px-2 text-sm">
                      <SortableDragHandle
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('Drag to reorder')}
                      >
                        <GripVertical />
                      </SortableDragHandle>
                      <PieceIcon
                        size="xs"
                        border
                        displayName={piece?.displayName}
                        logoUrl={piece?.logoUrl}
                        showTooltip={false}
                      />
                      <span className="min-w-0 flex-1 truncate text-gray-12">
                        {piece?.displayName ?? name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('Unpin {name}', {
                          name: piece?.displayName ?? name,
                        })}
                        onClick={() =>
                          onChange(pins.filter((pin) => pin !== name))
                        }
                      >
                        <X />
                      </Button>
                    </li>
                  </SortableItem>
                );
              })}
            </ul>
          </Sortable>
        )}
        <PiecePickerButton
          pieces={pieces}
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

function MenuPreview({
  tabs,
  pins,
  pieces,
  selectedId,
  onSelect,
}: {
  tabs: PieceSelectorTabConfig[];
  pins: string[];
  pieces: PieceMetadataModelSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const visible = tabs.filter((tab) => !tab.hidden);
  const selected =
    visible.find((tab) => tab.id === selectedId) ?? visible[0] ?? null;
  const byName = new Map(pieces.map((piece) => [piece.name, piece]));
  const labelOf = (tab: PieceSelectorTabConfig) => {
    const display = pieceSelectorCustomization.getBuiltinTabDisplay(
      tab.builtinTab,
    );
    return (
      (tab.title ?? '').trim() ||
      (display ? t(display.defaultLabel) : t('Untitled tab'))
    );
  };
  return (
    <SettingsPanel
      flush
      title={t('Preview')}
      description={t('What builders see when they add a step. Click a tab.')}
    >
      {visible.length === 0 ? (
        <p className="p-5 text-sm text-gray-11">
          {t('Every tab is hidden. Builders will only see search.')}
        </p>
      ) : (
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-1 rounded-xl bg-gray-3 p-1">
            {visible.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelect(tab.id)}
                className={cn(
                  'flex h-7 min-w-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-gray-11 outline-hidden focus-visible:ring-2 focus-visible:ring-gray-8 [&_svg]:size-3.5',
                  selected?.id === tab.id && 'bg-panel text-gray-12 shadow-xs',
                )}
              >
                {pieceSelectorCustomization.renderIcon(tab.icon) ??
                  pieceSelectorCustomization.renderIcon(
                    pieceSelectorCustomization.getBuiltinTabDisplay(
                      tab.builtinTab,
                    )?.defaultIconKey,
                  )}
                <span className="truncate">{labelOf(tab)}</span>
              </button>
            ))}
          </div>
          {selected && selected.kind === 'CUSTOM' ? (
            <div className="flex flex-col gap-3">
              <PreviewPieces
                names={selected.pieceNames ?? []}
                byName={byName}
              />
              {(selected.sections ?? []).map((section) => (
                <div key={section.id} className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-gray-11">
                    {section.title || t('Untitled section')}
                  </span>
                  <PreviewPieces names={section.pieceNames} byName={byName} />
                </div>
              ))}
              {(selected.pieceNames ?? []).length === 0 &&
                (selected.sections ?? []).length === 0 && (
                  <p className="text-sm text-gray-11">
                    {t(
                      'This tab is empty. Open it on the left to pick pieces.',
                    )}
                  </p>
                )}
            </div>
          ) : selected?.builtinTab === 'EXPLORE' && pins.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-gray-11">
                {t('Pinned')}
              </span>
              <PreviewPieces names={pins} byName={byName} />
              <p className="text-sm text-gray-11">
                {t('Popular pieces from the catalog follow.')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-11">
              {t(
                'A standard tab. It lists its pieces from the catalog, so it updates on its own.',
              )}
            </p>
          )}
        </div>
      )}
    </SettingsPanel>
  );
}

function PreviewPieces({
  names,
  byName,
}: {
  names: string[];
  byName: Map<string, PieceMetadataModelSummary>;
}) {
  if (names.length === 0) {
    return null;
  }
  return (
    <ul className="grid grid-cols-2 gap-1.5">
      {names.map((name) => {
        const piece = byName.get(name);
        return (
          <li
            key={name}
            className="flex h-9 min-w-0 items-center gap-2 rounded-lg border px-2 text-sm"
          >
            <PieceIcon
              size="xs"
              border
              displayName={piece?.displayName}
              logoUrl={piece?.logoUrl}
              showTooltip={false}
            />
            <span className="truncate">{piece?.displayName ?? name}</span>
          </li>
        );
      })}
    </ul>
  );
}

const TabCard = ({
  tab,
  pieces,
  isNew,
  onChange,
  onRemove,
}: {
  tab: PieceSelectorTabConfig;
  isNew: boolean;
  pieces: PieceMetadataModelSummary[];
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
    <div
      className={cn(
        'rounded-xl border bg-panel transition-colors',
        tab.hidden && 'opacity-60',
        expanded && 'border-accent-7',
      )}
    >
      <div className="flex items-center gap-1.5 p-2">
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
                  selectedPieceNames={section.pieceNames}
                  onChange={(pieceNames) =>
                    updateSection(section.id, { pieceNames })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-gray-11 hover:text-danger-11"
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
              className="text-danger-11 hover:bg-danger-3 hover:text-danger-11"
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
  selectedPieceNames,
  onChange,
}: {
  label: string;
  hint: string;
  pieces: PieceMetadataModelSummary[];
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
  selectedPieceNames,
  onChange,
  label,
  icon,
}: {
  pieces: PieceMetadataModelSummary[];
  selectedPieceNames: string[];
  onChange: (pieceNames: string[]) => void;
  label?: string;
  icon?: ReactNode;
}) => {
  const piecesByName = useMemo(
    () => new Map(pieces.map((piece) => [piece.name, piece])),
    [pieces],
  );
  const selectedPieces = selectedPieceNames
    .map((name) => piecesByName.get(name))
    .filter((piece): piece is PieceMetadataModelSummary => !!piece);

  const togglePiece = (name: string) =>
    onChange(
      selectedPieceNames.includes(name)
        ? selectedPieceNames.filter((candidate) => candidate !== name)
        : [...selectedPieceNames, name],
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'shrink-0 whitespace-nowrap font-normal',
            label !== undefined && 'self-start',
          )}
        >
          {icon}
          {label ?? t('{count} pieces', { count: selectedPieceNames.length })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {selectedPieces.length > 0 && (
          <div className="border-b p-2">
            <Sortable
              value={selectedPieces.map((piece) => ({ id: piece.name }))}
              onValueChange={(items) => onChange(items.map((item) => item.id))}
            >
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
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
                      <PieceIcon
                        logoUrl={piece.logoUrl}
                        displayName={piece.displayName}
                        showTooltip={false}
                        size="sm"
                      />
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
        <Command>
          <CommandInput placeholder={t('Search pieces')} />
          <CommandList>
            <CommandEmpty>{t('No pieces found')}</CommandEmpty>
            <CommandGroup>
              {pieces.map((piece) => {
                const isSelected = selectedPieceNames.includes(piece.name);
                return (
                  <CommandItem
                    key={piece.name}
                    value={piece.displayName}
                    onSelect={() => togglePiece(piece.name)}
                    className="flex items-center gap-2"
                  >
                    <PieceIcon
                      logoUrl={piece.logoUrl}
                      displayName={piece.displayName}
                      showTooltip={false}
                      size="sm"
                    />
                    <span className="grow truncate">{piece.displayName}</span>
                    {isSelected && <Check className="size-4 text-accent-11" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
