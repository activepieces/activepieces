import { ApEdition, ApFlagId, TelemetryEventName } from '@activepieces/shared';
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  CrownIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import React, { ComponentType, useState } from 'react';
import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuAction,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FeatureTier, TIER_LABELS } from '@/features/billing';
import { upgradeTarget } from '@/features/billing/components/upgrade-dialog';
import { flagsHooks } from '@/hooks/flags-hooks';

import { sidebarItemUtils } from './ap-sidebar-item-utils';

export const ApSidebarItem = (item: SidebarItemType) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { capture } = useTelemetry();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const [expandOverride, setExpandOverride] = useState<ExpandOverride | null>(
    null,
  );
  const pathname = location.pathname;
  const isLinkActive = isRouteActive({ pathname, to: item.to });
  const isCollapsed = state === 'collapsed' && !isMobile;
  const subItems = item.subItems ?? [];
  const hasSubItems = subItems.length > 0;
  const isExpanded =
    expandOverride?.pathname === pathname ? expandOverride.open : isLinkActive;
  const showSubItems = hasSubItems && isExpanded && !isCollapsed;
  const isSubItemLocked = (subItem: SidebarSubItemType) =>
    Boolean(item.locked) || Boolean(subItem.locked);
  const isCrowned = hasSubItems
    ? subItems.every(isSubItemLocked)
    : Boolean(item.locked);
  const isRowHighlighted = hasSubItems
    ? isLinkActive && !showSubItems
    : isLinkActive;
  const parentTier = item.tier ?? subItems.find(isSubItemLocked)?.tier;
  const lockedText = (tier: FeatureTier | undefined) =>
    t('Available on the {tier} plan', {
      tier: TIER_LABELS[upgradeTarget({ edition, tier })],
    });

  const captureLockedClick = ({ path, tier }: LockedClick) =>
    capture({
      name: TelemetryEventName.ADMIN_NAV_LOCKED_CLICKED,
      payload: { path, tier },
    });

  const closeMobileSheet = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const subItemHref = (subItem: SidebarSubItemType) => {
    if (!isLinkActive || subItem.keepSearch === undefined) {
      return subItem.to;
    }
    const kept = sidebarItemUtils.keptSearch({
      search: location.search,
      keys: subItem.keepSearch,
    });
    return kept === '' ? subItem.to : `${subItem.to}?${kept}`;
  };

  const isSubItemActive = (subItem: SidebarSubItemType) =>
    isRouteActive({ pathname, to: subItem.to, end: subItem.end }) ||
    (subItem.alsoActiveOn ?? []).some((path) =>
      isRouteActive({ pathname, to: path }),
    );

  const handleSubItemClick = (subItem: SidebarSubItemType) => {
    closeMobileSheet();
    if (
      isSubItemLocked(subItem) &&
      !isRouteActive({ pathname, to: subItem.to, end: true })
    ) {
      captureLockedClick({ path: subItem.to, tier: subItem.tier ?? item.tier });
    }
  };

  const icon = item.icon && renderIcon({ icon: item.icon });
  const collapsedTooltip = isCrowned
    ? {
        children: (
          <span className="flex flex-col">
            <span>{item.label}</span>
            <span className="opacity-70">{lockedText(parentTier)}</span>
          </span>
        ),
      }
    : item.label;

  if (isCollapsed && hasSubItems) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              isActive={isLinkActive}
              tooltip={collapsedTooltip}
              aria-label={item.label}
              aria-current={isLinkActive ? 'page' : undefined}
            >
              {icon}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={8}
            className="min-w-44"
          >
            <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
            {subItems.map((subItem) => {
              const active = isSubItemActive(subItem);
              return (
                <DropdownMenuItem
                  key={subItem.to}
                  asChild
                  className={active ? 'bg-gray-3 font-medium' : undefined}
                >
                  <Link
                    to={subItemHref(subItem)}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => handleSubItemClick(subItem)}
                  >
                    <span className="flex-1 truncate">{subItem.label}</span>
                    {isSubItemLocked(subItem) && <CrownMark />}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  const toggleGroup = () => setExpandOverride({ pathname, open: !isExpanded });
  const handleGroupClick = () => {
    if (isLinkActive) {
      toggleGroup();
      return;
    }
    const [firstSubItem] = subItems;
    handleSubItemClick(firstSubItem);
    setExpandOverride(null);
    navigate(subItemHref(firstSubItem));
  };
  const button = hasSubItems ? (
    <SidebarMenuButton
      isActive={isRowHighlighted}
      aria-expanded={isExpanded}
      onClick={handleGroupClick}
      className="pr-8"
    >
      {icon}
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate">{item.label}</span>
        {isCrowned && <CrownMark />}
      </span>
    </SidebarMenuButton>
  ) : (
    <SidebarMenuButton
      asChild
      isActive={isRowHighlighted}
      tooltip={collapsedTooltip}
    >
      <Link
        to={item.to}
        aria-label={isCollapsed ? item.label : undefined}
        aria-current={isRowHighlighted ? 'page' : undefined}
        onClick={() => {
          closeMobileSheet();
          if (
            isCrowned &&
            !isRouteActive({ pathname, to: item.to, end: true })
          ) {
            captureLockedClick({ path: item.to, tier: parentTier });
          }
        }}
      >
        {icon}
        {!isCollapsed && (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate">{item.label}</span>
            {isCrowned && <CrownMark />}
          </span>
        )}
      </Link>
    </SidebarMenuButton>
  );

  return (
    <SidebarMenuItem>
      {isCrowned && !isCollapsed ? (
        <LockedTooltip text={lockedText(parentTier)}>{button}</LockedTooltip>
      ) : (
        button
      )}
      {hasSubItems && (
        <SidebarMenuAction
          aria-label={
            isExpanded
              ? t('Collapse {name}', { name: item.label })
              : t('Expand {name}', { name: item.label })
          }
          aria-expanded={isExpanded}
          onClick={toggleGroup}
          className="text-gray-11"
        >
          {isExpanded ? (
            <HugeiconsIcon icon={ArrowDown01Icon} />
          ) : (
            <HugeiconsIcon icon={ArrowRight01Icon} />
          )}
        </SidebarMenuAction>
      )}
      {showSubItems && (
        <SidebarMenuSub>
          {subItems.map((subItem) => {
            const shut = isSubItemLocked(subItem);
            const active = isSubItemActive(subItem);
            const subButton = (
              <SidebarMenuSubButton asChild isActive={active}>
                <Link
                  to={subItemHref(subItem)}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => handleSubItemClick(subItem)}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{subItem.label}</span>
                    {shut && !isCrowned && <CrownMark />}
                  </span>
                </Link>
              </SidebarMenuSubButton>
            );
            return (
              <SidebarMenuSubItem key={subItem.to}>
                {shut && !isCrowned ? (
                  <LockedTooltip text={lockedText(subItem.tier ?? item.tier)}>
                    {subButton}
                  </LockedTooltip>
                ) : (
                  subButton
                )}
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
};

function LockedTooltip({ text, children }: LockedTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" align="center">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function CrownMark() {
  return (
    <>
      <HugeiconsIcon
        icon={CrownIcon}
        aria-hidden
        className="size-4! shrink-0 text-gray-9"
      />
      <span className="sr-only">{t('Requires a plan upgrade')}</span>
    </>
  );
}

function isRouteActive({
  pathname,
  to,
  end = false,
}: {
  pathname: string;
  to: string;
  end?: boolean;
}) {
  return matchPath({ path: to, end }, pathname) !== null;
}

function renderIcon({ icon }: { icon: NonNullable<SidebarItemType['icon']> }) {
  const className = 'size-4 shrink-0 pointer-events-none';
  if (typeof icon === 'function') {
    return React.createElement(icon, { className });
  }
  return <HugeiconsIcon icon={icon} className={className} />;
}

export type SidebarSubItemType = {
  to: string;
  label: string;
  end?: boolean;
  locked?: boolean;
  tier?: FeatureTier;
  keepSearch?: string[];
  alsoActiveOn?: string[];
};

export type SidebarItemType = {
  to: string;
  label: string;
  type: 'link';
  icon?: IconSvgElement | ComponentType<{ className?: string }>;
  locked?: boolean;
  tier?: FeatureTier;
  subItems?: SidebarSubItemType[];
};

type ExpandOverride = {
  pathname: string;
  open: boolean;
};

type LockedTooltipProps = {
  text: string;
  children: React.ReactElement;
};

type LockedClick = {
  path: string;
  tier?: FeatureTier;
};
