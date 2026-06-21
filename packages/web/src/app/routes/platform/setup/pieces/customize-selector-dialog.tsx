import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  apId,
  PieceSelectorTabConfig,
  PieceSelectorTabSection,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  CheckIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  PlusIcon,
  PuzzleIcon,
  Settings2Icon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/sortable';
import {
  PieceIcon,
  pieceSelectorCustomization,
  PIECE_SELECTOR_TAB_ICON_OPTIONS,
  piecesHooks,
} from '@/features/pieces';
import { platformPiecesMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

const borderlessInputClass =
  'border-transparent bg-transparent shadow-none hover:border-input focus-visible:bg-background';

export const CustomizeSelectorDialog = ({
  isEnabled,
}: {
  isEnabled: boolean;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" disabled={!isEnabled}>
          <Settings2Icon className="size-4 mr-2" />
          {t('Customize Selector')}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0 p-0"
      >
        <SelectorTabsEditor
          key={open ? 'open' : 'closed'}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

const SelectorTabsEditor = ({ onClose }: { onClose: () => void }) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const [tabs, setTabs] = useState<PieceSelectorTabConfig[]>(
    platform.pieceSelectorConfig?.tabs.length
      ? platform.pieceSelectorConfig.tabs
      : pieceSelectorCustomization.getDefaultTabConfigs(),
  );
  const { pieces } = piecesHooks.usePieces({
    includeHidden: true,
    includeTags: false,
  });
  const saveMutation = platformPiecesMutations.useUpdatePieceSelectorConfig({
    platformId: platform.id,
    refetch,
  });

  const updateTab = (id: string, patch: Partial<PieceSelectorTabConfig>) =>
    setTabs((prev) =>
      prev.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab)),
    );

  const removeTab = (id: string) =>
    setTabs((prev) => prev.filter((tab) => tab.id !== id));

  const addCustomTab = () =>
    setTabs((prev) => [
      ...prev,
      {
        id: apId(),
        kind: 'CUSTOM',
        title: '',
        icon: pieceSelectorCustomization.getRandomIconKey(),
        hidden: false,
        pieceNames: [],
        sections: [],
      },
    ]);

  const handleSave = () => {
    const normalizedTabs = tabs.map((tab) => {
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
    const customTabWithoutName = normalizedTabs.some(
      (tab) => tab.kind === 'CUSTOM' && !tab.title,
    );
    if (customTabWithoutName) {
      toast.error(t('Custom tabs must have a name'));
      return;
    }
    const sectionWithoutName = normalizedTabs.some((tab) =>
      (tab.sections ?? []).some((section) => section.title === ''),
    );
    if (sectionWithoutName) {
      toast.error(t('Sections must have a name'));
      return;
    }
    saveMutation.mutate({ tabs: normalizedTabs }, { onSuccess: onClose });
  };

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-4">
        <SheetTitle>{t('Customize Piece Selector')}</SheetTitle>
        <SheetDescription>
          {t(
            'Reorder, rename, hide tabs, or add custom tabs to highlight specific pieces in the flow builder.',
          )}
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 px-6 py-2">
          <Sortable value={tabs} onValueChange={setTabs}>
            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <SortableItem key={tab.id} value={tab.id} asChild>
                  <div>
                    <TabCard
                      tab={tab}
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
            variant="outline"
            size="sm"
            className="self-start text-muted-foreground mt-1"
            onClick={addCustomTab}
          >
            <PlusIcon className="size-4 mr-2" />
            {t('Add custom tab')}
          </Button>
        </div>
      </ScrollArea>

      <SheetFooter className="flex-row justify-between px-6 py-4 border-t">
        <ConfirmationDeleteDialog
          title={t('Reset to default?')}
          message={t('The piece selector will return to its default layout.')}
          warning={t(
            'All your custom tabs and sections will be permanently removed.',
          )}
          buttonText={t('Reset')}
          entityName={t('customization')}
          mutationFn={async () => {
            await saveMutation.mutateAsync(null);
            onClose();
          }}
        >
          <Button variant="ghost">{t('Reset to default')}</Button>
        </ConfirmationDeleteDialog>
        <Button onClick={handleSave} loading={saveMutation.isPending}>
          {t('Save')}
        </Button>
      </SheetFooter>
    </>
  );
};

const TabCard = ({
  tab,
  pieces,
  onChange,
  onRemove,
}: {
  tab: PieceSelectorTabConfig;
  pieces: PieceMetadataModelSummary[];
  onChange: (patch: Partial<PieceSelectorTabConfig>) => void;
  onRemove: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const display = pieceSelectorCustomization.getBuiltinTabDisplay(
    tab.builtinTab,
  );
  const iconNode = pieceSelectorCustomization.renderIcon(tab.icon) ??
    pieceSelectorCustomization.renderIcon(display?.defaultIconKey) ?? (
      <PuzzleIcon className="size-5" />
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
        'rounded-lg border bg-card transition-colors',
        tab.hidden && 'opacity-60',
        expanded && 'border-primary/40',
      )}
    >
      <div className="flex items-center gap-1.5 p-2">
        <SortableDragHandle
          variant="ghost"
          size="icon"
          className="shrink-0 size-7 text-muted-foreground/50"
        >
          <GripVerticalIcon className="size-4" />
        </SortableDragHandle>

        <TabIconPicker
          value={tab.icon}
          iconNode={iconNode}
          onChange={(icon) => onChange({ icon })}
        />

        <Input
          value={tab.title ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange({ title: e.target.value })}
          className={cn(borderlessInputClass, 'h-8 flex-1 font-medium')}
        />

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 size-7 text-muted-foreground"
          onClick={() => onChange({ hidden: !tab.hidden })}
          title={tab.hidden ? t('Show tab') : t('Hide tab')}
        >
          {tab.hidden ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </Button>

        {isCustom && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 size-7 text-muted-foreground"
            onClick={() => setExpanded((prev) => !prev)}
            title={t('Pieces & sections')}
          >
            <ChevronDownIcon
              className={cn('size-4 transition-transform', {
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
                className="flex items-center gap-1.5 rounded-md border bg-background pl-2 pr-1 py-1"
              >
                <Input
                  value={section.title}
                  placeholder={t('Section name')}
                  onChange={(e) =>
                    updateSection(section.id, { title: e.target.value })
                  }
                  className={cn(borderlessInputClass, 'h-7 flex-1 text-sm')}
                />
                <PiecePickerButton
                  pieces={pieces}
                  selectedPieceNames={section.pieceNames}
                  onChange={(pieceNames) =>
                    updateSection(section.id, { pieceNames })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSection(section.id)}
                  title={t('Delete section')}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-muted-foreground"
              onClick={addSection}
            >
              <PlusIcon className="size-4 mr-2" />
              {t('Add section')}
            </Button>
          </div>

          <div className="flex justify-end p-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onRemove}
            >
              <TrashIcon className="size-4 mr-2" />
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
        <span className="text-xs text-muted-foreground">{hint}</span>
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
          variant="ghost"
          size="icon"
          className="shrink-0 size-8 text-foreground hover:bg-muted"
        >
          {iconNode}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <div className="grid grid-cols-6 gap-1 max-h-[260px] overflow-y-auto overflow-x-hidden">
          {PIECE_SELECTOR_TAB_ICON_OPTIONS.map(({ key, Icon }) => (
            <Button
              key={key}
              variant="ghost"
              size="icon"
              className={cn('size-9', {
                'bg-accent text-primary': value === key,
              })}
              onClick={() => onChange(key)}
            >
              <Icon className="size-4" />
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
}: {
  pieces: PieceMetadataModelSummary[];
  selectedPieceNames: string[];
  onChange: (pieceNames: string[]) => void;
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
          variant="outline"
          size="sm"
          className="shrink-0 whitespace-nowrap font-normal"
        >
          {t('{count} pieces', { count: selectedPieceNames.length })}
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
                    <div className="flex items-center gap-2 rounded-sm px-1 py-0.5">
                      <SortableDragHandle
                        variant="ghost"
                        size="icon"
                        className="shrink-0 size-6 text-muted-foreground/60"
                      >
                        <GripVerticalIcon className="size-3.5" />
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
                        variant="ghost"
                        size="icon"
                        className="shrink-0 size-6"
                        onClick={() => togglePiece(piece.name)}
                      >
                        <XIcon className="size-3.5" />
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
                    {isSelected && (
                      <CheckIcon className="size-4 text-primary" />
                    )}
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
