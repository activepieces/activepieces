import { ApEdition, ApFlagId, TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Gem } from 'lucide-react';
import React, { ComponentType, ReactNode, useRef, useState } from 'react';
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
import { sidebarStyles } from './sidebar-styles';

export const ApSidebarItem = (item: SidebarItemType) => {
  const location = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { capture } = useTelemetry();
  const iconRef = useRef<AnimatedIconHandle | null>(null);
  const [expandOverride, setExpandOverride] = useState<ExpandOverride | null>(
    null,
  );
  const pathname = location.pathname;
  const isLinkActive = isRouteActive({
    pathname,
    to: item.activeOn ?? item.to,
  });
  const isCollapsed = state === 'collapsed' && !isMobile;
  const subItems = item.subItems ?? [];
  const hasSubItems = subItems.length > 0;
  const isExpanded =
    expandOverride?.pathname === pathname ? expandOverride.open : isLinkActive;
  const showSubItems = hasSubItems && isExpanded && !isCollapsed;
  const isSubItemLocked = (subItem: SidebarSubItemType) =>
    Boolean(item.locked) || Boolean(subItem.locked);
  const isPremium = hasSubItems
    ? subItems.every(isSubItemLocked)
    : Boolean(item.locked);
  const isRowHighlighted = hasSubItems
    ? isLinkActive && !showSubItems
    : isLinkActive;
  const parentTier = item.tier ?? subItems.find(isSubItemLocked)?.tier;

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

  const keepSearchWithinSection = (to: string) => {
    if (!hasSubItems || !isLinkActive) {
      return to;
    }
    const shared = sidebarItemUtils.sectionSearch(location.search);
    return shared === '' ? to : `${to}?${shared}`;
  };

  const isSubItemActive = (subItem: SidebarSubItemType) =>
    isRouteActive({ pathname, to: subItem.to, end: subItem.end });

  const handleSubItemClick = (subItem: SidebarSubItemType) => {
    closeMobileSheet();
    if (
      isSubItemLocked(subItem) &&
      !isRouteActive({ pathname, to: subItem.to, end: true })
    ) {
      captureLockedClick({ path: subItem.to, tier: subItem.tier ?? item.tier });
    }
  };

  const hoverHandlers = {
    onMouseEnter: () => iconRef.current?.startAnimation?.(),
    onMouseLeave: () => iconRef.current?.stopAnimation?.(),
  };

  const plainIcon = item.icon && renderIcon({ Icon: item.icon, ref: iconRef });
  const icon = isPremium ? <PremiumGlyph className="size-4" /> : plainIcon;
  const lockedLabel = `${item.label}, ${t('Requires a plan upgrade')}`;
  const collapsedName = isPremium ? lockedLabel : item.label;

  const collapsedTooltip = isPremium
    ? {
        children: (
          <span className="flex flex-col">
            <span>{item.label}</span>
            <span className="opacity-70">
              <LockedText tier={parentTier} />
            </span>
          </span>
        ),
      }
    : item.label;

  const toggleGroup = () => setExpandOverride({ pathname, open: !isExpanded });

  const handleRowClick = () => {
    closeMobileSheet();
    item.onClick?.();
    if (hasSubItems) {
      setExpandOverride({ pathname: item.to, open: true });
    }
    if (isPremium && !isRouteActive({ pathname, to: item.to, end: true })) {
      captureLockedClick({ path: item.to, tier: parentTier });
    }
  };

  const label = (
    <span
      className={cn(
        'flex min-w-0 flex-1 items-center gap-1.5',
        sidebarStyles.labelFade,
      )}
    >
      <span className="truncate">{item.label}</span>
      {isPremium && (
        <span className="sr-only">{t('Requires a plan upgrade')}</span>
      )}
    </span>
  );

  const button = (
    <SidebarMenuButton
      asChild
      isActive={isRowHighlighted}
      tooltip={collapsedTooltip}
      className={cn(hasSubItems && 'pr-8')}
    >
      <Link
        to={keepSearchWithinSection(item.to)}
        aria-label={isCollapsed ? collapsedName : undefined}
        aria-current={isRowHighlighted ? 'page' : undefined}
        onClick={handleRowClick}
        {...hoverHandlers}
      >
        {icon}
        {label}
        {item.badge && (
          <span className={cn('ml-auto flex', sidebarStyles.labelFade)}>
            {item.badge}
          </span>
        )}
      </Link>
    </SidebarMenuButton>
  );

  return (
    <SidebarMenuItem>
      {isPremium ? (
        <LockedTooltip tier={parentTier} disabled={isCollapsed}>
          {button}
        </LockedTooltip>
      ) : (
        button
      )}
      {hasSubItems && (
        <SidebarMenuAction
          aria-label={isExpanded ? t('Collapse') : t('Expand')}
          aria-expanded={showSubItems}
          aria-hidden={isCollapsed || undefined}
          tabIndex={isCollapsed ? -1 : undefined}
          onClick={toggleGroup}
          className="text-gray-9"
        >
          <ChevronRight
            aria-hidden
            className={cn(sidebarStyles.rotate, isExpanded && 'rotate-90')}
          />
        </SidebarMenuAction>
      )}
      {hasSubItems && (
        <div
          className={cn(
            sidebarStyles.expand,
            showSubItems
              ? 'visible grid-rows-[1fr] opacity-100'
              : 'invisible grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <SidebarMenuSub>
              {subItems.map((subItem) => {
                const shut = isSubItemLocked(subItem);
                const active = isSubItemActive(subItem);
                const subButton = (
                  <SidebarMenuSubButton asChild isActive={active}>
                    <Link
                      to={keepSearchWithinSection(subItem.to)}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => handleSubItemClick(subItem)}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap">
                        <span className="truncate">{subItem.label}</span>
                        {shut && !isPremium && (
                          <PremiumMark className="size-3.5" />
                        )}
                      </span>
                    </Link>
                  </SidebarMenuSubButton>
                );
                return (
                  <SidebarMenuSubItem key={subItem.to}>
                    {shut && !isPremium ? (
                      <LockedTooltip tier={subItem.tier ?? item.tier}>
                        {subButton}
                      </LockedTooltip>
                    ) : (
                      subButton
                    )}
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </div>
        </div>
      )}
    </SidebarMenuItem>
  );
};

function LockedText({ tier }: { tier?: FeatureTier }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const namedTier = edition === ApEdition.COMMUNITY ? undefined : tier;

  return namedTier === undefined
    ? t('Not included in your plan')
    : t('Included in the {tier} plan', { tier: TIER_LABELS[namedTier] });
}

function LockedTooltip({ tier, disabled, children }: LockedTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={disabled}>
        <LockedText tier={tier} />
      </TooltipContent>
    </Tooltip>
  );
}

function PremiumGlyph({ className }: { className: string }) {
  return (
    <Gem aria-hidden className={cn('shrink-0 text-accent-11', className)} />
  );
}

function PremiumMark({ className }: { className: string }) {
  return (
    <>
      <PremiumGlyph className={className} />
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
};

export type SidebarItemType = {
  to: string;
  label: string;
  type: 'link';
  icon?: ComponentType<{ className?: string }>;
  locked?: boolean;
  tier?: FeatureTier;
  subItems?: SidebarSubItemType[];
  activeOn?: string;
  badge?: ReactNode;
  onClick?: () => void;
};

type ExpandOverride = {
  pathname: string;
  open: boolean;
};

type LockedTooltipProps = {
  tier?: FeatureTier;
  disabled?: boolean;
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
