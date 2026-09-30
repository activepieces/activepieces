import { ApEdition, ApFlagId, TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight, Crown } from 'lucide-react';
import React, { ComponentType, useEffect, useRef, useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import {
  SidebarMenuAction,
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
import { flagsHooks } from '@/hooks/flags-hooks';

import { sidebarItemUtils } from './ap-sidebar-item-utils';

export const ApSidebarItem = (item: SidebarItemType) => {
  const location = useLocation();
  const { state } = useSidebar();
  const { capture } = useTelemetry();
  const iconRef = useRef<AnimatedIconHandle | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = location.pathname;
  const isLinkActive = isRouteActive({ pathname, to: item.to });
  const isCollapsed = state === 'collapsed';
  const subItems = item.subItems ?? [];
  const hasSubItems = subItems.length > 0;
  const [isExpanded, setIsExpanded] = useState(isLinkActive);
  const showSubItems = hasSubItems && isExpanded && !isCollapsed;
  const isSubItemLocked = (subItem: SidebarSubItemType) =>
    Boolean(item.locked) || Boolean(subItem.locked);
  const isCrowned = hasSubItems
    ? subItems.every(isSubItemLocked)
    : Boolean(item.locked);
  const isRowHighlighted = !hasSubItems && isLinkActive;
  const parentTier = item.tier ?? subItems.find(isSubItemLocked)?.tier;

  const captureLockedClick = ({ path, tier }: LockedClick) =>
    capture({
      name: TelemetryEventName.ADMIN_NAV_LOCKED_CLICKED,
      payload: { path, tier },
    });

  const keepSearchWithinSection = (to: string) => {
    if (!hasSubItems || !isLinkActive) {
      return to;
    }
    const shared = sidebarItemUtils.sectionSearch(location.search);
    return shared === '' ? to : `${to}?${shared}`;
  };

  useEffect(() => {
    if (isLinkActive) {
      setIsExpanded(true);
    }
  }, [isLinkActive]);

  useEffect(() => {
    if (isHovered) {
      iconRef.current?.startAnimation?.();
    } else {
      iconRef.current?.stopAnimation?.();
    }
  }, [isHovered]);

  const button = (
    <SidebarMenuButton asChild isActive={isRowHighlighted} tooltip={item.label}>
      <Link
        to={keepSearchWithinSection(item.to)}
        aria-current={isRowHighlighted ? 'page' : undefined}
        onClick={() => {
          if (hasSubItems) {
            setIsExpanded(true);
          }
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
        {item.icon && renderIcon({ Icon: item.icon, ref: iconRef })}
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
        <LockedTooltip tier={parentTier}>{button}</LockedTooltip>
      ) : (
        button
      )}
      {!isCollapsed && hasSubItems && (
        <SidebarMenuAction
          className="text-gray-11"
          aria-label={isExpanded ? t('Collapse') : t('Expand')}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          {isExpanded ? (
            <ChevronDown aria-hidden />
          ) : (
            <ChevronRight aria-hidden />
          )}
        </SidebarMenuAction>
      )}
      {showSubItems && (
        <SidebarMenuSub>
          {subItems.map((subItem) => {
            const shut = isSubItemLocked(subItem);
            const subItemTier = subItem.tier ?? item.tier;
            const subItemActive = isRouteActive({
              pathname,
              to: subItem.to,
              end: subItem.end,
            });
            const subButton = (
              <SidebarMenuSubButton asChild isActive={subItemActive}>
                <Link
                  to={keepSearchWithinSection(subItem.to)}
                  aria-current={subItemActive ? 'page' : undefined}
                  onClick={
                    shut &&
                    !isRouteActive({ pathname, to: subItem.to, end: true })
                      ? () =>
                          captureLockedClick({
                            path: subItem.to,
                            tier: subItemTier,
                          })
                      : undefined
                  }
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
                  <LockedTooltip tier={subItemTier}>{subButton}</LockedTooltip>
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

function LockedTooltip({ tier, children }: LockedTooltipProps) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const namedTier = edition === ApEdition.COMMUNITY ? undefined : tier;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" align="center">
        {namedTier === undefined
          ? t('Not included in your plan')
          : t('Included in the {tier} plan', { tier: TIER_LABELS[namedTier] })}
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
    className: 'size-5 shrink-0 pointer-events-none',
    ref,
  } as { className: string });
}

export type SidebarSubItemType = {
  to: string;
  label: string;
  end?: boolean;
  locked?: boolean;
  tier?: FeatureTier;
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

type LockedTooltipProps = {
  tier?: FeatureTier;
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
