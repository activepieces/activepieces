import {
  PIECE_SELECTOR_BUILTIN_TABS,
  PieceSelectorConfig,
  PieceSelectorTabConfig,
} from '@activepieces/shared';
import {
  AiMagicIcon,
  BoxIcon,
  BoxesIcon,
  Briefcase01Icon,
  BrowserIcon,
  BubbleChatIcon,
  Building03Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  ChipIcon,
  CloudIcon,
  CompassIcon,
  ComputerTerminal02Icon,
  CreditCardIcon,
  DashboardSpeed02Icon,
  DashboardSquare01Icon,
  DatabaseIcon,
  FavouriteIcon,
  File02Icon,
  FireIcon,
  Flag01Icon,
  FlashIcon,
  Folder01Icon,
  GiftIcon,
  Globe02Icon,
  GraduationCapIcon,
  Key01Icon,
  Layers01Icon,
  Link02Icon,
  MagicWand01Icon,
  Mail01Icon,
  Megaphone01Icon,
  Notification01Icon,
  PackageIcon,
  Pulse01Icon,
  PuzzleIcon,
  Robot01Icon,
  Rocket01Icon,
  Settings01Icon,
  Shield01Icon,
  ShoppingCart01Icon,
  SourceCodeIcon,
  StarIcon,
  TableIcon,
  Target03Icon,
  UserMultipleIcon,
  WorkflowSquare02Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import React from 'react';

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
import { PieceSelectorTabType } from '@/features/pieces/stores/piece-selector-tabs-provider';

type DefaultBuiltinTab = {
  value: PieceSelectorTabType;
  name: string;
  icon: React.ReactNode;
};

const PIECE_SELECTOR_TAB_ICONS: Record<string, IconSvgElement> = {
  Puzzle: PuzzleIcon,
  LayoutGrid: DashboardSquare01Icon,
  Sparkles: AiMagicIcon,
  Wrench: Wrench01Icon,
  CheckCircle2: CheckmarkCircle02Icon,
  Star: StarIcon,
  Heart: FavouriteIcon,
  Rocket: Rocket01Icon,
  Zap: FlashIcon,
  Bot: Robot01Icon,
  WandSparkles: MagicWand01Icon,
  Globe: Globe02Icon,
  Database: DatabaseIcon,
  Box: BoxIcon,
  Briefcase: Briefcase01Icon,
  Compass: CompassIcon,
  Flag: Flag01Icon,
  Folder: Folder01Icon,
  Terminal: ComputerTerminal02Icon,
  Activity: Pulse01Icon,
  AppWindow: BrowserIcon,
  Bell: Notification01Icon,
  Blocks: BoxesIcon,
  Building: Building03Icon,
  Calendar: Calendar03Icon,
  Cloud: CloudIcon,
  Code: SourceCodeIcon,
  Cpu: ChipIcon,
  CreditCard: CreditCardIcon,
  FileText: File02Icon,
  Flame: FireIcon,
  Gauge: DashboardSpeed02Icon,
  Gift: GiftIcon,
  GraduationCap: GraduationCapIcon,
  Key: Key01Icon,
  Layers: Layers01Icon,
  Link: Link02Icon,
  Mail: Mail01Icon,
  Megaphone: Megaphone01Icon,
  MessageSquare: BubbleChatIcon,
  Package: PackageIcon,
  Settings: Settings01Icon,
  Shield: Shield01Icon,
  ShoppingCart: ShoppingCart01Icon,
  Table: TableIcon,
  Target: Target03Icon,
  Users: UserMultipleIcon,
  Workflow: WorkflowSquare02Icon,
};

const getRandomIconKey = (): string => {
  const keys = Object.keys(PIECE_SELECTOR_TAB_ICONS);
  return keys[Math.floor(Math.random() * keys.length)];
};

const renderIcon = (iconKey: string | undefined): React.ReactNode | null => {
  if (!iconKey) {
    return null;
  }
  const Icon = PIECE_SELECTOR_TAB_ICONS[iconKey];
  return Icon ? <HugeiconsIcon icon={Icon} className="size-5" /> : null;
};

const buildResolvedTabs = ({
  availableBuiltinTabs,
  config,
}: {
  availableBuiltinTabs: DefaultBuiltinTab[];
  config: PieceSelectorConfig | null | undefined;
}): ResolvedPieceSelectorTab[] => {
  const builtinByKey = new Map<string, DefaultBuiltinTab>(
    availableBuiltinTabs.map((tab) => [tab.value, tab]),
  );

  if (!config || config.tabs.length === 0) {
    return availableBuiltinTabs.map((tab) => ({
      key: tab.value,
      type: tab.value,
      name: tab.name,
      icon: tab.icon,
    }));
  }

  const usedBuiltins = new Set<string>();
  const resolved = config.tabs.reduce<ResolvedPieceSelectorTab[]>(
    (acc, tabConfig) => {
      if (tabConfig.kind === 'BUILTIN') {
        if (tabConfig.builtinTab) {
          usedBuiltins.add(tabConfig.builtinTab);
        }
        const builtin = tabConfig.builtinTab
          ? builtinByKey.get(tabConfig.builtinTab)
          : undefined;
        if (tabConfig.hidden || !builtin) {
          return acc;
        }
        acc.push({
          key: builtin.value,
          type: builtin.value,
          name: tabConfig.title ?? builtin.name,
          icon: renderIcon(tabConfig.icon) ?? builtin.icon,
        });
        return acc;
      }
      if (tabConfig.hidden) {
        return acc;
      }
      acc.push({
        key: tabConfig.id,
        type: PieceSelectorTabType.CUSTOM,
        customTabId: tabConfig.id,
        name: tabConfig.title ?? '',
        icon: renderIcon(tabConfig.icon) ?? (
          <HugeiconsIcon icon={PuzzleIcon} className="size-5" />
        ),
      });
      return acc;
    },
    [],
  );

  const appendedBuiltins = availableBuiltinTabs
    .filter((tab) => !usedBuiltins.has(tab.value))
    .map((tab) => ({
      key: tab.value,
      type: tab.value,
      name: tab.name,
      icon: tab.icon,
    }));

  return [...resolved, ...appendedBuiltins];
};

const BUILTIN_TAB_DISPLAY: Record<
  string,
  { defaultLabel: string; defaultIconKey: string }
> = {
  EXPLORE: { defaultLabel: 'Explore', defaultIconKey: 'LayoutGrid' },
  AI_AND_AGENTS: { defaultLabel: 'AI & Agents', defaultIconKey: 'Sparkles' },
  APPS: { defaultLabel: 'Apps', defaultIconKey: 'Puzzle' },
  UTILITY: { defaultLabel: 'Utility', defaultIconKey: 'Wrench' },
  APPROVALS: { defaultLabel: 'Approvals', defaultIconKey: 'CheckCircle2' },
};

const getDefaultTabConfigs = (): PieceSelectorTabConfig[] =>
  PIECE_SELECTOR_BUILTIN_TABS.map((builtinTab) => ({
    id: builtinTab,
    kind: 'BUILTIN' as const,
    builtinTab,
    hidden: false,
  }));

const getBuiltinTabDisplay = (
  builtinTab: string | undefined,
): { defaultLabel: string; defaultIconKey: string } | undefined =>
  builtinTab ? BUILTIN_TAB_DISPLAY[builtinTab] : undefined;

const getCustomTab = ({
  config,
  customTabId,
}: {
  config: PieceSelectorConfig | null | undefined;
  customTabId: string | null;
}): PieceSelectorTabConfig | null => {
  if (!config || !customTabId) {
    return null;
  }
  return (
    config.tabs.find(
      (candidate) =>
        candidate.id === customTabId && candidate.kind === 'CUSTOM',
    ) ?? null
  );
};

export const pieceSelectorCustomization = {
  buildResolvedTabs,
  getCustomTab,
  getDefaultTabConfigs,
  getBuiltinTabDisplay,
  getRandomIconKey,
  renderIcon,
};

export const PIECE_SELECTOR_TAB_ICON_OPTIONS: {
  key: string;
  Icon: IconSvgElement;
}[] = Object.entries(PIECE_SELECTOR_TAB_ICONS).map(([key, Icon]) => ({
  key,
  Icon,
}));

export type ResolvedPieceSelectorTab = {
  key: string;
  type: PieceSelectorTabType;
  customTabId?: string;
  name: string;
  icon: React.ReactNode;
};
