import { isNil, tryCatchSync } from '@activepieces/core-utils';
import {
  EnterpriseTrialStatus,
  PlatformRole,
  PlatformWithoutSensitiveData,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { FlaskConical, Minus, Moon, RotateCcw, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { create } from 'zustand';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useRailCollapsed } from '@/features/workspace/lib/rail-collapsed';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { enterpriseTrialKey } from '../hooks/enterprise-trial-hooks';

export function EnterpriseTrialDevPicker() {
  const { embedState } = useEmbedding();
  if (!import.meta.env.DEV || embedState.isEmbedded) {
    return null;
  }
  return createPortal(<Panel />, document.body);
}

function Panel() {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const override = useOverrideStore();
  const rail = useRailCollapsed();
  const { resolvedTheme, setPreference } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => readFlag(OPEN_KEY, true));

  useEffect(() => {
    applyOverride({ queryClient, platformId: platform.id, override });
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'success') {
        applyOverride({ queryClient, platformId: platform.id, override });
      }
    });
    return unsubscribe;
  }, [queryClient, platform.id, override]);

  const setScenario = (patch: Partial<OverrideState>) => {
    const next = { ...override, ...patch, anchor: Date.now() };
    useOverrideStore.setState(next);
    persistOverride(next);
    if (patch.viewer === 'me') {
      queryClient
        .invalidateQueries({ queryKey: ['currentUser'] })
        .catch(() => undefined);
    }
    queryClient
      .invalidateQueries({ queryKey: ['platform'] })
      .catch(() => undefined);
    if (next.scenario === 'real') {
      queryClient
        .invalidateQueries({ queryKey: enterpriseTrialKey(platform.id) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: ['currentUser'] })
        .catch(() => undefined);
    }
  };

  const toggleOpen = (next: boolean) => {
    setOpen(next);
    writeFlag(OPEN_KEY, next);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => toggleOpen(true)}
        className="pointer-events-auto fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-gray-1 px-3 py-2 text-xs font-medium text-gray-12 shadow-panel hover:bg-gray-3"
      >
        <FlaskConical className="size-3.5 text-accent-11" />
        {t('Trial dev panel')}
      </button>
    );
  }

  const scenario =
    SCENARIOS.find((s) => s.id === override.scenario) ?? SCENARIOS[0];
  const where = whereToLook({
    scenario: override.scenario,
    viewer: override.viewer,
    pathname,
    collapsed: rail.preference,
  });

  return (
    <aside className="pointer-events-auto fixed bottom-4 right-4 z-50 flex max-h-[calc(100dvh-32px)] w-80 flex-col overflow-hidden rounded-xl border bg-gray-1 text-gray-12 shadow-panel">
      <header className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <FlaskConical className="size-4 text-accent-11" />
        <span className="flex-1 text-sm font-semibold">
          {t('Enterprise trial · dev')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={t('Toggle theme')}
          onClick={() =>
            setPreference(resolvedTheme === 'dark' ? 'light' : 'dark')
          }
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={t('Minimise')}
          onClick={() => toggleOpen(false)}
        >
          <Minus className="size-4" />
        </Button>
      </header>

      <div className="flex shrink-0 flex-col gap-1.5 border-b bg-gray-2 px-3 py-2 text-xs">
        <span className="font-medium text-gray-12">{t('Where to look')}</span>
        <span className="text-gray-11">{where.text}</span>
        {where.actions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {where.actions.map((action) => (
              <Button
                key={action.label}
                size="xs"
                variant="outline"
                onClick={() => {
                  if (action.collapse !== undefined) {
                    rail.setCollapsed(action.collapse);
                  }
                  if (action.to !== undefined) {
                    navigate(action.to);
                  }
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col gap-3 p-3">
          <Field label={t('Trial state')}>
            <div className="grid grid-cols-2 gap-1">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScenario({ scenario: s.id })}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-left text-xs hover:bg-gray-3',
                    override.scenario === s.id &&
                      'border-accent-7 bg-accent-3 font-medium text-accent-11',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="rounded-md bg-gray-2 p-2 text-xs leading-relaxed text-gray-11">
              {scenario.behaviour}
            </p>
          </Field>
          {override.scenario === 'active' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-11">
                  {t('Hours left')}
                </span>
                <span className="font-semibold">
                  {override.hoursLeft}h ({Math.ceil(override.hoursLeft / 24)}d)
                </span>
              </div>
              <Slider
                min={1}
                max={168}
                step={1}
                value={[override.hoursLeft]}
                onValueChange={([hoursLeft]) => setScenario({ hoursLeft })}
              />
            </div>
          )}
          <Field label={t('Viewer')}>
            <Segmented
              value={override.viewer}
              onChange={(viewer) => setScenario({ viewer })}
              options={[
                { value: 'me', label: t('Me (admin)') },
                { value: 'member', label: t('Member') },
              ]}
            />
          </Field>
          <Field label={t('Sidebar')}>
            <Segmented
              value={rail.preference ? 'collapsed' : 'expanded'}
              onChange={(value) => rail.setCollapsed(value === 'collapsed')}
              options={[
                { value: 'expanded', label: t('Expanded') },
                { value: 'collapsed', label: t('Collapsed') },
              ]}
            />
          </Field>
          <div className="flex flex-wrap gap-1">
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                clearKeys('ap-enterprise-trial-ended-seen-');
                window.location.reload();
              }}
            >
              {t('Replay ended popup')}
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                clearKeys('ap-enterprise-trial-ending-dismissed-');
                window.location.reload();
              }}
            >
              {t('Un-dismiss banner')}
            </Button>
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t p-2 text-xs text-gray-11">
        <span className="min-w-0 flex-1 truncate">
          {override.scenario === 'real'
            ? t('Real: AP routes → local console stub')
            : t('Simulated in this browser only')}
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            setScenario({ scenario: 'real', viewer: 'me', hoursLeft: 120 });
            rail.setCollapsed(false);
          }}
        >
          <RotateCcw className="size-3.5" />
          {t('Reset')}
        </Button>
      </footer>
    </aside>
  );
}

function applyOverride({
  queryClient,
  platformId,
  override,
}: {
  queryClient: QueryClient;
  platformId: string;
  override: OverrideState;
}): void {
  if (override.viewer === 'member') {
    for (const query of queryClient
      .getQueryCache()
      .findAll({ queryKey: ['currentUser'] })) {
      const user = queryClient.getQueryData<UserWithMetaInformation>(
        query.queryKey,
      );
      if (!isNil(user) && user.platformRole !== PlatformRole.MEMBER) {
        queryClient.setQueryData(query.queryKey, {
          ...user,
          platformRole: PlatformRole.MEMBER,
        });
      }
    }
  }
  if (override.scenario === 'real') {
    return;
  }
  const status = scenarioStatus(override);
  const statusKey = enterpriseTrialKey(platformId);
  const currentStatus =
    queryClient.getQueryData<EnterpriseTrialStatus>(statusKey);
  if (JSON.stringify(currentStatus) !== JSON.stringify(status)) {
    queryClient.setQueryData(statusKey, status);
  }
  const planEndsAt = status.state === 'active' ? status.endsAt : null;
  for (const query of queryClient
    .getQueryCache()
    .findAll({ queryKey: ['platform'] })) {
    const platform = queryClient.getQueryData<PlatformWithoutSensitiveData>(
      query.queryKey,
    );
    if (isNil(platform)) {
      continue;
    }
    const planName =
      override.scenario === 'active-paid' ? 'team' : platform.plan.plan;
    const creditsOut = override.scenario === 'credits-out';
    const usage =
      creditsOut && !isNil(platform.usage)
        ? { ...platform.usage, creditsRemaining: 0, creditsUsed: 1000 }
        : platform.usage;
    if (
      platform.plan.enterpriseTrialEndsAt !== planEndsAt ||
      platform.plan.plan !== planName ||
      (creditsOut && platform.usage?.creditsRemaining !== 0)
    ) {
      queryClient.setQueryData(query.queryKey, {
        ...platform,
        usage,
        plan: {
          ...platform.plan,
          plan: planName,
          enterpriseTrialEndsAt: planEndsAt,
        },
      });
    }
  }
}

function scenarioStatus(override: OverrideState): EnterpriseTrialStatus {
  const now = override.anchor;
  const hour = 3600000;
  switch (override.scenario) {
    case 'active':
    case 'active-paid':
    case 'credits-out':
    case 'extended':
    case 'last-day': {
      const hoursLeft =
        override.scenario === 'last-day'
          ? 20
          : override.scenario === 'extended'
          ? 20 * 24
          : override.hoursLeft;
      return {
        state: 'active',
        startedAt: new Date(now - (168 - hoursLeft) * hour).toISOString(),
        endsAt: new Date(now + hoursLeft * hour).toISOString(),
        extended: override.scenario === 'extended',
      };
    }
    case 'ended':
      return {
        state: 'ended',
        startedAt: new Date(now - 170 * hour).toISOString(),
        endsAt: new Date(now - 2 * hour).toISOString(),
        extended: false,
      };
    case 'used':
      return { state: 'used', startedAt: null, endsAt: null, extended: false };
    case 'unavailable':
      return {
        state: 'unavailable',
        startedAt: null,
        endsAt: null,
        extended: false,
      };
    default:
      return {
        state: 'eligible',
        startedAt: null,
        endsAt: null,
        extended: false,
      };
  }
}

function whereToLook({
  scenario,
  viewer,
  pathname,
  collapsed,
}: {
  scenario: Scenario;
  viewer: Viewer;
  pathname: string;
  collapsed: boolean;
}): { text: string; actions: WhereAction[] } {
  const onAdmin = pathname.startsWith('/platform');
  const toApp: WhereAction[] = onAdmin
    ? [{ label: t('Go to the app'), to: '/' }]
    : [];
  const expand: WhereAction[] = collapsed
    ? [{ label: t('Expand sidebar'), collapse: false }]
    : [];
  if (viewer === 'member') {
    if (ACTIVE_SCENARIOS.includes(scenario)) {
      return {
        text: t(
          'Members only see the trial in the credits card at the bottom of the sidebar. No buttons, banners or popups.',
        ),
        actions: [...toApp, ...expand],
      };
    }
    return {
      text: t(
        'Members see nothing about the trial in this state; locked features look like today.',
      ),
      actions: toApp,
    };
  }
  switch (scenario) {
    case 'eligible':
      return {
        text: t(
          'Open any locked feature: the primary button is "Start free trial". Billing shows a "Try Enterprise" row.',
        ),
        actions: [
          { label: t('Locked: Audit log'), to: '/platform/audit-log' },
          { label: t('Billing'), to: '/platform/billing' },
        ],
      };
    case 'active':
    case 'active-paid':
    case 'credits-out':
    case 'extended':
      return {
        text: t(
          'The quiet trial line on the credits card (nothing in the collapsed rail). Billing shows the trial.',
        ),
        actions: [
          ...toApp,
          ...expand,
          { label: t('Billing'), to: '/platform/billing' },
        ],
      };
    case 'last-day':
      return {
        text: t(
          'Amber banner at the top of every page (project and admin), amber credits card.',
        ),
        actions: [...toApp, ...expand],
      };
    case 'ended':
      return {
        text: t(
          'A one-time popup on the next page. Billing shows when it ended and "Talk to sales".',
        ),
        actions: [{ label: t('Billing'), to: '/platform/billing' }],
      };
    case 'used':
      return {
        text: t(
          'Only Billing mentions it. Locked features show today’s upgrade buttons.',
        ),
        actions: [
          { label: t('Billing'), to: '/platform/billing' },
          { label: t('Locked: Audit log'), to: '/platform/audit-log' },
        ],
      };
    case 'unavailable':
      return {
        text: t('No trial UI anywhere (Community or no billing).'),
        actions: [],
      };
    default:
      return {
        text: t(
          'Real data from the AP routes (console stub on the box). Admin-only status; members read the plan fields.',
        ),
        actions: [...toApp, { label: t('Billing'), to: '/platform/billing' }],
      };
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-11">{label}</span>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-md border bg-gray-2 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded px-1 py-1 text-xs text-gray-11 hover:text-gray-12',
            value === option.value &&
              'bg-gray-1 font-medium text-gray-12 shadow-sm',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function readFlag(key: string, fallback: boolean): boolean {
  const { data } = tryCatchSync(() => localStorage.getItem(key));
  return data === null || data === undefined ? fallback : data === '1';
}

function writeFlag(key: string, value: boolean): void {
  tryCatchSync(() => localStorage.setItem(key, value ? '1' : '0'));
}

function clearKeys(prefix: string): void {
  tryCatchSync(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    }
  });
}

function readOverride(): OverrideState {
  const { data } = tryCatchSync(() =>
    JSON.parse(localStorage.getItem(OVERRIDE_KEY) ?? 'null'),
  );
  return { ...DEFAULT_OVERRIDE, ...(data ?? {}), anchor: Date.now() };
}

function persistOverride(state: OverrideState): void {
  tryCatchSync(() => localStorage.setItem(OVERRIDE_KEY, JSON.stringify(state)));
}

const ACTIVE_SCENARIOS: Scenario[] = [
  'active',
  'active-paid',
  'credits-out',
  'extended',
  'last-day',
];

const OPEN_KEY = 'dev-enterprise-trial-picker-open';
const OVERRIDE_KEY = 'dev-enterprise-trial-override';

const DEFAULT_OVERRIDE: OverrideState = {
  scenario: 'real',
  viewer: 'me',
  hoursLeft: 120,
  anchor: Date.now(),
};

const useOverrideStore = create<OverrideState>(() => readOverride());

const SCENARIOS: { id: Scenario; label: string; behaviour: string }[] = [
  {
    id: 'real',
    label: 'Real (stub)',
    behaviour:
      'Whatever the AP routes return. On the box they talk to a local console stub, so starting a trial here is safe and real end to end.',
  },
  {
    id: 'eligible',
    label: 'Eligible',
    behaviour:
      'Admins see "Start free trial" as the primary button on every locked feature, and a "Try Enterprise" row in Billing. Members see today’s locked UI.',
  },
  {
    id: 'active',
    label: 'In trial',
    behaviour:
      'The credits card stays as today, plus one calm trial hint (pick the variant below). Details are on hover and in Billing. Amber in the last 2 days.',
  },
  {
    id: 'active-paid',
    label: 'Trial + paid plan',
    behaviour:
      'Bought Team during the trial: the trial keeps running to its end date next to the new plan. Billing keeps the normal Team card and adds the trial row; hover on the sidebar line says "then back to Team".',
  },
  {
    id: 'credits-out',
    label: 'Credits out in trial',
    behaviour:
      'Credits run out during the trial: today’s credits warning (red badge, top-up/upgrade button, credits banner) works as usual; the trial line stays above it, unchanged.',
  },
  {
    id: 'extended',
    label: 'Extended (+14d)',
    behaviour:
      'Sales extended the trial: it is simply an active trial with a later end date (20 days left here).',
  },
  {
    id: 'last-day',
    label: 'Last day',
    behaviour:
      'Within 36 hours of the end: an amber banner for admins on every page, dismissible for the day. The sidebar hint turns amber and says "ends tomorrow at…" / "ends today at…".',
  },
  {
    id: 'ended',
    label: 'Just ended',
    behaviour:
      'Admins get a one-time "trial ended" popup; Billing keeps showing when it ended. Optional: a banner on every page.',
  },
  {
    id: 'used',
    label: 'Already used',
    behaviour:
      'No trial offer anywhere; Billing says it was already used and offers "Talk to sales".',
  },
  {
    id: 'unavailable',
    label: 'Unavailable',
    behaviour: 'Community or no billing: no trial UI at all.',
  },
];

type Scenario =
  | 'real'
  | 'eligible'
  | 'active'
  | 'active-paid'
  | 'credits-out'
  | 'extended'
  | 'last-day'
  | 'ended'
  | 'used'
  | 'unavailable';
type Viewer = 'me' | 'member';
type OverrideState = {
  scenario: Scenario;
  viewer: Viewer;
  hoursLeft: number;
  anchor: number;
};
type WhereAction = { label: string; to?: string; collapse?: boolean };
