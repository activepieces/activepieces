import { ApEdition, ApFlagId, TelemetryEventName } from '@activepieces/shared';
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  CrownIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import React, { ComponentType, useEffect, useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FeatureTier, TIER_LABELS } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { sidebarItemUtils } from './ap-sidebar-item-utils';

export const ApSidebarItem = (item: SidebarItemType) => {
  const location = useLocation();
  const { state } = useSidebar();
  const { capture } = useTelemetry();
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

  const button = (
    <SidebarMenuButton
      asChild
      className={cn('h-8 [&_svg]:block [&_svg]:size-5', {
        'bg-gray-4 hover:bg-gray-4!': isRowHighlighted,
        'pr-8': hasSubItems && !isCollapsed,
      })}
    >
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
      >
        {item.icon && renderIcon({ icon: item.icon })}
        {!isCollapsed && (
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn('truncate', { 'font-medium': isRowHighlighted })}
            >
              {item.label}
            </span>
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
          className="right-1.5 text-gray-9"
          aria-label={isExpanded ? t('Collapse') : t('Expand')}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          {isExpanded ? (
            <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden />
          ) : (
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
          )}
        </SidebarMenuAction>
      )}
      {showSubItems && (
        <SidebarMenuSub className="mx-0 ml-7 border-0 px-0 py-1">
          {subItems.map((subItem) => {
            const shut = isSubItemLocked(subItem);
            const subItemActive = isRouteActive({
              pathname,
              to: subItem.to,
              end: subItem.end,
            });
            const subButton = (
              <SidebarMenuSubButton
                asChild
                isActive={subItemActive}
                className="h-8"
              >
                <Link
                  to={keepSearchWithinSection(subItem.to)}
                  aria-current={subItemActive ? 'page' : undefined}
                  onClick={
                    shut &&
                    !isRouteActive({ pathname, to: subItem.to, end: true })
                      ? () =>
                          captureLockedClick({
                            path: subItem.to,
                            tier: subItem.tier,
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
                  <LockedTooltip tier={subItem.tier}>{subButton}</LockedTooltip>
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
      <HugeiconsIcon
        icon={CrownIcon}
        aria-hidden
        className="size-3.5! shrink-0 text-gray-9"
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
  const className = 'size-5 shrink-0 pointer-events-none';
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

type LockedTooltipProps = {
  tier?: FeatureTier;
  children: React.ReactElement;
};
type LockedClick = {
  path: string;
  tier?: FeatureTier;
};
