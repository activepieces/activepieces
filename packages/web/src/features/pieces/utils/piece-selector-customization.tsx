import {
  PIECE_SELECTOR_BUILTIN_TABS,
  PieceSelectorConfig,
  PieceSelectorTabConfig,
} from '@activepieces/shared';
import {
  ActivityIcon,
  AppWindowIcon,
  BellIcon,
  BlocksIcon,
  BotIcon,
  BoxIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CloudIcon,
  CodeIcon,
  CompassIcon,
  CpuIcon,
  CreditCardIcon,
  DatabaseIcon,
  FileTextIcon,
  FlagIcon,
  FlameIcon,
  FolderIcon,
  GaugeIcon,
  GiftIcon,
  GlobeIcon,
  GraduationCapIcon,
  HeartIcon,
  KeyIcon,
  LayersIcon,
  LayoutGridIcon,
  LinkIcon,
  LucideIcon,
  MailIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  PackageIcon,
  PuzzleIcon,
  RocketIcon,
  SettingsIcon,
  ShieldIcon,
  ShoppingCartIcon,
  SparklesIcon,
  StarIcon,
  TableIcon,
  TargetIcon,
  TerminalIcon,
  UsersIcon,
  WandSparklesIcon,
  WorkflowIcon,
  WrenchIcon,
  ZapIcon,
} from 'lucide-react';
import React from 'react';

import { PieceSelectorTabType } from '@/features/pieces/stores/piece-selector-tabs-provider';

type DefaultBuiltinTab = {
  value: PieceSelectorTabType;
  name: string;
  icon: React.ReactNode;
};

const PIECE_SELECTOR_TAB_ICONS: Record<string, LucideIcon> = {
  Puzzle: PuzzleIcon,
  LayoutGrid: LayoutGridIcon,
  Sparkles: SparklesIcon,
  Wrench: WrenchIcon,
  CheckCircle2: CheckCircle2Icon,
  Star: StarIcon,
  Heart: HeartIcon,
  Rocket: RocketIcon,
  Zap: ZapIcon,
  Bot: BotIcon,
  WandSparkles: WandSparklesIcon,
  Globe: GlobeIcon,
  Database: DatabaseIcon,
  Box: BoxIcon,
  Briefcase: BriefcaseIcon,
  Compass: CompassIcon,
  Flag: FlagIcon,
  Folder: FolderIcon,
  Terminal: TerminalIcon,
  Activity: ActivityIcon,
  AppWindow: AppWindowIcon,
  Bell: BellIcon,
  Blocks: BlocksIcon,
  Building: BuildingIcon,
  Calendar: CalendarIcon,
  Cloud: CloudIcon,
  Code: CodeIcon,
  Cpu: CpuIcon,
  CreditCard: CreditCardIcon,
  FileText: FileTextIcon,
  Flame: FlameIcon,
  Gauge: GaugeIcon,
  Gift: GiftIcon,
  GraduationCap: GraduationCapIcon,
  Key: KeyIcon,
  Layers: LayersIcon,
  Link: LinkIcon,
  Mail: MailIcon,
  Megaphone: MegaphoneIcon,
  MessageSquare: MessageSquareIcon,
  Package: PackageIcon,
  Settings: SettingsIcon,
  Shield: ShieldIcon,
  ShoppingCart: ShoppingCartIcon,
  Table: TableIcon,
  Target: TargetIcon,
  Users: UsersIcon,
  Workflow: WorkflowIcon,
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
  return Icon ? <Icon className="size-5" /> : null;
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
        icon: renderIcon(tabConfig.icon) ?? <PuzzleIcon className="size-5" />,
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
  Icon: LucideIcon;
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

export type { PieceSelectorTabConfig };
