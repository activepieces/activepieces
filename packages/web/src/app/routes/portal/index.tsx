import { t } from 'i18next';
import { Activity, BarChart3, Mail, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';

type PortalView = {
  agencyName: string;
  clientName: string;
  status: string;
  clientTier: string;
  branding: Record<string, unknown>;
  usage: {
    executionsThisMonth: number;
    activeWorkflows: number;
    aiCreditsUsed: number;
  };
  supportEmail: string | null;
  welcomeMessage: string | null;
};

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  business: 'Business',
  pro: 'Pro',
};

export function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .get<PortalView>(`/v1/synkra/agency/public/${encodeURIComponent(token)}`)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch(() => {
        setError(
          t(
            'This portal link is no longer available. Please contact your service provider for a new link.',
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-gray-2 text-gray-11">
        {t('Loading…')}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-gray-2 px-4">
        <div className="max-w-md rounded-lg border bg-white p-8 text-center">
          <div className="font-medium text-lg">{t('Portal unavailable')}</div>
          <p className="text-sm text-gray-11 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const branding = data.branding;
  const logoUrl = branding.logoUrl as string | undefined;
  const primaryColor = (branding.primaryColor as string) ?? '#5DD62C';
  const welcome = data.welcomeMessage ?? `${t('Welcome back')}, ${data.clientName}`;
  const agencyName = data.agencyName;

  return (
    <div className="min-h-svh bg-gray-2 py-10 px-4">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        {/* Branded header */}
        <div className="flex items-center gap-3">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={agencyName} className="h-10 object-contain" />
          )}
          <div>
            <div className="font-semibold text-lg">{agencyName}</div>
            <div className="text-sm text-gray-11">{welcome}</div>
          </div>
        </div>

        {/* Package card */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-11">{t('Your package')}</div>
              <div className="text-2xl font-semibold mt-1">
                {TIER_LABELS[data.clientTier] ?? data.clientTier}
              </div>
            </div>
            <div
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: primaryColor, color: '#000' }}
            >
              {data.status === 'active' ? t('Active') : data.status}
            </div>
          </div>
        </div>

        {/* Usage */}
        <div>
          <div className="text-sm text-gray-11 mb-3">
            {t('Usage this month')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UsageTile
              icon={Activity}
              label={t('Workflow runs')}
              value={data.usage.executionsThisMonth.toLocaleString()}
              colour={primaryColor}
            />
            <UsageTile
              icon={BarChart3}
              label={t('Active workflows')}
              value={data.usage.activeWorkflows.toLocaleString()}
              colour={primaryColor}
            />
            <UsageTile
              icon={Sparkles}
              label={t('AI credits used')}
              value={data.usage.aiCreditsUsed.toLocaleString()}
              colour={primaryColor}
            />
          </div>
        </div>

        {/* Support */}
        {data.supportEmail && (
          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-11">
              <Mail className="h-4 w-4" />
              {t('Support')}
            </div>
            <a
              href={`mailto:${data.supportEmail}`}
              className="text-sm mt-2 inline-block"
              style={{ color: primaryColor }}
            >
              {data.supportEmail}
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-9 pt-4">
          {t('Powered by')} {agencyName}
        </div>
      </div>
    </div>
  );
}

function UsageTile({
  icon: Icon,
  label,
  value,
  colour,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  colour: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: colour }} />
        <span className="text-sm text-gray-11">{label}</span>
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}
