import { t } from 'i18next';
import { ArrowUpRight } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTitle } from '@/app/components/page-title';
import { Button } from '@/components/ui/button';
import { synkraBillingHooks } from '@/features/synkra-billing';

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  business: 'Business',
  pro: 'Pro',
};

function UsageBar({ label, used, limit, unit }: { label: string; used: number; limit: number; unit?: string }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-gray-11">{used}{unit ? ` ${unit}` : ''} / {limit}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-4 overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BillingManagePage() {
  const { data: sub } = synkraBillingHooks.useSubscription();
  const { data: usage } = synkraBillingHooks.useUsage();
  const navigate = useNavigate();

  const limits = sub.limits as Record<string, number>;
  const storageLimitGb = limits.storageGb ?? 1;
  const storageUsedGb = usage.storageBytesUsed / (1024 ** 3);
  const storagePct = Math.min(100, storageLimitGb > 0 ? (storageUsedGb / storageLimitGb) * 100 : 0);

  return (
    <PageTitle title={t('Billing & Usage')}>
      <div className="mx-auto w-full max-w-4xl p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{t('Billing & Usage')}</h1>
            <p className="text-sm text-gray-11 mt-1">
              {t('Current plan')}: <strong className="text-primary">{TIER_LABELS[sub.tier] ?? sub.tier}</strong>
              {sub.currentPeriodEnd && (
                <>
                  {' · '}
                  {sub.cancelAtPeriodEnd ? t('cancels on') : t('renews on')}{' '}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </>
              )}
            </p>
          </div>
          <Button onClick={() => navigate('../checkout')}>
            {sub.tier === 'free' ? t('Upgrade') : t('Change plan')}
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-lg border bg-white p-5 flex flex-col gap-4">
          <h2 className="font-medium">{t('Usage this period')}</h2>
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('Storage')}</span>
                <span className="text-gray-11">
                  {storageUsedGb.toFixed(2)} GB / {storageLimitGb} GB
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-4 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${storagePct}%` }} />
              </div>
            </div>
            <UsageBar label={t('Emails')} used={usage.emailsUsed} limit={limits.emails ?? 0} />
            <UsageBar label={t('AI operations')} used={usage.aiOpsUsed} limit={limits.aiOps ?? 0} />
            <UsageBar label={t('SMS')} used={usage.smsUsed} limit={limits.sms ?? 0} />
            <UsageBar label={t('WhatsApp')} used={usage.whatsappUsed} limit={limits.whatsapp ?? 0} />
            <UsageBar label={t('Voice')} used={usage.voiceMinutesUsed} limit={limits.voiceMinutes ?? 0} unit="min" />
          </div>
        </div>
      </div>
    </PageTitle>
  );
}
