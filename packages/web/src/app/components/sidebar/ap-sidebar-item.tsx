import { ApEdition, ApFlagId, TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight, Crown } from 'lucide-react';
import React, { ComponentType, useEffect, useRef, useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

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
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { capture } = useTelemetry();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const iconRef = useRef<AnimatedIconHandle | null>(null);
  const [isHovered, setIsHovered] = useState(false);
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
    t('Included in the {tier} plan', {
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

  useEffect(() => {
    if (isHovered) {
      iconRef.current?.startAnimation?.();
    } else {
      iconRef.current?.stopAnimation?.();
    }
  }, [isHovered]);

  const icon = item.icon && renderIcon({ Icon: item.icon, ref: iconRef });
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
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
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
  const button = hasSubItems ? (
    <SidebarMenuButton
      isActive={isRowHighlighted}
      aria-expanded={isExpanded}
      onClick={toggleGroup}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon}
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate">{item.label}</span>
        {isCrowned && <CrownMark />}
      </span>
      {isExpanded ? (
        <ChevronDown aria-hidden className="text-gray-11" />
      ) : (
        <ChevronRight aria-hidden className="text-gray-11" />
      )}
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
      <Crown aria-hidden className="size-4! shrink-0 text-gray-9" />
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

function renderIcon({
  Icon,
  ref,
}: {
  Icon: ComponentType<{ className?: string }>;
  ref: React.RefObject<AnimatedIconHandle | null>;
}) {
  return React.createElement(Icon, {
    className: 'size-4 shrink-0 pointer-events-none',
    ref,
  } as { className: string });
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
  icon?: ComponentType<{ className?: string }>;
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

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};
