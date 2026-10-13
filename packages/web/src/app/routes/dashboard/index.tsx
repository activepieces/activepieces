import { t } from 'i18next';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Mail,
  MessageSquare,
  Plug,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/app/components/page-title';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { synkraDashboardHooks } from '@/features/synkra-dashboard';

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  business: 'Business',
  pro: 'Pro',
};

const RUN_STATUS_STYLE: Record<string, string> = {
  SUCCEEDED: 'text-green-10',
  FAILED: 'text-red-10',
  RUNNING: 'text-yellow-10',
  QUOTA_EXCEEDED: 'text-yellow-10',
};

function pct(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function DashboardPage() {
  const { data, isLoading } = synkraDashboardHooks.useSummary();
  const { checkAccess } = useAuthorization();
  const navigate = useNavigate();

  if (isLoading || !data) {
    return (
      <PageTitle title={t('Dashboard')}>
        <div className="flex h-full items-center justify-center text-gray-11">
          {t('Loading…')}
        </div>
      </PageTitle>
    );
  }

  const tierLabel = TIER_LABELS[data.tier] ?? data.tier;
  const isFree = data.tier === 'free';
  const runsPct = pct(data.usage.executionsThisMonth, data.plan.executions);
  const aiPct = pct(data.usage.aiOpsUsed, data.plan.aiOps);
  const emailPct = pct(data.usage.emailsUsed, data.plan.emails);
  const storageBytes = data.usage.storageBytesUsed;
  const storageLimitBytes = data.plan.storageGb * 1024 * 1024 * 1024;
  const storagePct = pct(storageBytes, storageLimitBytes);

  const newFlow = () =>
    navigate(authenticationSession.appendProjectRoutePrefix('/flows?newFlow=true'));

  return (
    <PageTitle title={t('Dashboard')}>
      <div className="mx-auto w-full max-w-5xl p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{t('Dashboard')}</h1>
            <p className="text-sm text-gray-11 mt-1">
              {t('Current plan')}: <strong className="text-primary">{tierLabel}</strong>
              {isFree && (
                <>
                  {' · '}
                  <Link to="/billing" className="text-primary hover:underline">
                    {t('Upgrade to unlock more')}
                  </Link>
                </>
              )}
            </p>
          </div>
          {isFree && (
            <Button onClick={() => navigate('/billing')} className="gap-1">
              <Sparkles className="h-4 w-4" />
              {t('Upgrade')}
            </Button>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction
            icon={Plus}
            label={t('New flow')}
            description={t('Start an automation from scratch or a template')}
            onClick={newFlow}
          />
          <QuickAction
            icon={Plug}
            label={t('Connect integration')}
            description={t('Link Slack, Shopify, HubSpot and more')}
            onClick={() => navigate('/integrations')}
          />
          <QuickAction
            icon={Bot}
            label={t('Chat with AI')}
            description={t('Describe a workflow in plain English')}
            onClick={() => navigate('/chat')}
          />
        </div>

        {/* Usage tiles */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">{t('Usage this month')}</h2>
            <Link
              to="/billing"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {t('Detailed usage')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <UsageTile
              icon={Activity}
              label={t('Runs')}
              used={data.usage.executionsThisMonth}
              limit={data.plan.executions}
              pct={runsPct}
              onClick={() => navigate(authenticationSession.appendProjectRoutePrefix('/runs'))}
            />
            <UsageTile
              icon={Sparkles}
              label={t('AI credits')}
              used={data.usage.aiOpsUsed}
              limit={data.plan.aiOps}
              pct={aiPct}
              onClick={() => navigate('/billing')}
            />
            <UsageTile
              icon={Mail}
              label={t('Emails')}
              used={data.usage.emailsUsed}
              limit={data.plan.emails}
              pct={emailPct}
              onClick={() => navigate('/billing')}
            />
            <UsageTile
              icon={BarChart3}
              label={t('Storage')}
              usedLabel={formatBytes(storageBytes)}
              limitLabel={`${data.plan.storageGb} GB`}
              pct={storagePct}
              onClick={() => navigate('/billing')}
            />
          </div>
        </div>

        {/* Recent activity + Integrations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent runs — spans 2 cols */}
          <div className="lg:col-span-2 rounded-lg border bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-11" />
                {t('Recent runs')}
              </h2>
              <Link
                to={authenticationSession.appendProjectRoutePrefix('/runs')}
                className="text-sm text-primary hover:underline"
              >
                {t('View all')}
              </Link>
            </div>
            {data.recentRuns.length === 0 ? (
              <div className="text-sm text-gray-11 py-8 text-center">
                {t('No runs yet. Create a flow to get started.')}
              </div>
            ) : (
              <div className="flex flex-col divide-y">
                {data.recentRuns.map((r) => (
                  <Link
                    key={r.id}
                    to={authenticationSession.appendProjectRoutePrefix(`/runs/${r.id}`)}
                    className="flex items-center justify-between py-2.5 hover:bg-gray-2 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {r.flowName}
                      </div>
                      <div className="text-xs text-gray-11">
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        RUN_STATUS_STYLE[r.status] ?? 'text-gray-11',
                      )}
                    >
                      {r.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Integrations summary */}
          <div className="rounded-lg border bg-white p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium flex items-center gap-2">
                <Plug className="h-4 w-4 text-gray-11" />
                {t('Integrations')}
              </h2>
              <Link
                to="/integrations"
                className="text-sm text-primary hover:underline"
              >
                {t('Manage')}
              </Link>
            </div>
            <div className="text-3xl font-semibold">
              {data.connectedIntegrations}
            </div>
            <div className="text-sm text-gray-11">
              {t('Connected')}
            </div>
            <div className="mt-2 pt-3 border-t flex items-center justify-between text-sm">
              <span className="text-gray-11">{t('Active workflows')}</span>
              <span className="font-medium">{data.activeWorkflows}</span>
            </div>
          </div>
        </div>
      </div>
    </PageTitle>
  );
}

function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border bg-white p-4 hover:border-primary hover:bg-primary/5 transition-colors flex items-start gap-3"
    >
      <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-gray-11 mt-0.5">{description}</div>
      </div>
    </button>
  );
}

function UsageTile({
  icon: Icon,
  label,
  used,
  limit,
  usedLabel,
  limitLabel,
  pct,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  used?: number;
  limit?: number;
  usedLabel?: string;
  limitLabel?: string;
  pct: number;
  onClick: () => void;
}) {
  const isHigh = pct >= 90;
  const isWarn = pct >= 70 && pct < 90;
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border bg-white p-4 hover:border-primary/50 transition-colors flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-11">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
      </div>
      <div className="text-xl font-semibold tabular-nums">
        {usedLabel ?? used?.toLocaleString()}
        <span className="text-sm font-normal text-gray-11 ml-1">
          / {limitLabel ?? limit?.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-3 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all',
            isHigh ? 'bg-red-9' : isWarn ? 'bg-yellow-9' : 'bg-primary',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
