import { t } from 'i18next';
import { ArrowUpRight, ArrowDown, X, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { PageTitle } from '@/app/components/page-title';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { synkraBillingHooks } from '@/features/synkra-billing';

const TIER_LABELS: Record<string, string> = {
  free: 'Free', starter: 'Starter', business: 'Business', pro: 'Pro',
};
const TIER_ORDER = ['free', 'starter', 'business', 'pro'] as const;

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
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [downgradeOpen, setDowngradeOpen] = useState(false);

  const limits = sub.limits as Record<string, number>;
  const storageLimitGb = limits.storageGb ?? 1;
  const storageUsedGb = usage.storageBytesUsed / (1024 ** 3);
  const storagePct = Math.min(100, storageLimitGb > 0 ? (storageUsedGb / storageLimitGb) * 100 : 0);

  const refresh = () => qc.invalidateQueries({ queryKey: ['synkra-subscription'] });

  const doCancel = async () => {
    setBusy('cancel');
    try {
      await api.post('/v1/synkra/subscription/cancel', {});
      toast.success(t('Cancellation scheduled.'));
      refresh();
    } catch (e) {
      toast.error((e as Error).message || t('Could not cancel.'));
    } finally {
      setBusy(null);
      setCancelOpen(false);
    }
  };

  const doReactivate = async () => {
    setBusy('reactivate');
    try {
      await api.post('/v1/synkra/subscription/reactivate', {});
      toast.success(t('Subscription reactivated.'));
      refresh();
    } catch (e) {
      toast.error((e as Error).message || t('Could not reactivate.'));
    } finally {
      setBusy(null);
    }
  };

  const doDowngrade = async (toTier: 'free' | 'starter' | 'business') => {
    setBusy('downgrade');
    try {
      await api.post('/v1/synkra/subscription/downgrade', { toTier });
      toast.success(t('Downgrade scheduled for end of period.'));
      refresh();
    } catch (e) {
      toast.error((e as Error).message || t('Could not schedule downgrade.'));
    } finally {
      setBusy(null);
      setDowngradeOpen(false);
    }
  };

  const currentIdx = TIER_ORDER.indexOf(sub.tier as (typeof TIER_ORDER)[number]);
  const lowerTiers = TIER_ORDER.slice(0, currentIdx).filter((x) => x !== 'free') as Array<'starter' | 'business'>;
  const canDowngrade = sub.tier !== 'free' && lowerTiers.length > 0;

  return (
    <PageTitle title={t('Billing & Usage')}>
      <div className="mx-auto w-full max-w-4xl p-6 flex flex-col gap-6">
        {!sub.paystackConfigured && (
          <div className="rounded-lg border border-yellow-6 bg-yellow-2 p-4 text-sm">
            <div className="font-medium text-yellow-11">{t('Payments coming soon')}</div>
            <div className="text-yellow-11 mt-1">
              {t('Upgrades are not yet live. Contact hello@synkra.co.za to be notified when they open.')}
            </div>
          </div>
        )}
        {sub.scheduledChange && (
          <div className="rounded-lg border bg-yellow-2 p-4 flex items-start gap-3">
            <RefreshCw className="h-4 w-4 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium">
                {sub.scheduledChange.kind === 'cancel'
                  ? t('Your plan is scheduled to end')
                  : t('Downgrade scheduled')}
              </div>
              {sub.currentPeriodEnd && (
                <div className="text-sm text-gray-11 mt-1">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={doReactivate} disabled={busy === 'reactivate'}>
              {t('Reactivate')}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{t('Billing & Usage')}</h1>
            <p className="text-sm text-gray-11 mt-1">
              {t('Current plan')}: <strong className="text-primary">{TIER_LABELS[sub.tier] ?? sub.tier}</strong>
              {sub.currentPeriodEnd && (
                <>
                  {' · '}
                  {sub.cancelAtPeriodEnd ? t('ends on') : t('renews on')}{' '}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {canDowngrade && !sub.cancelAtPeriodEnd && (
              <Button variant="outline" onClick={() => setDowngradeOpen(true)}>
                <ArrowDown className="mr-1 h-4 w-4" />
                {t('Downgrade')}
              </Button>
            )}
            {sub.tier !== 'free' && !sub.cancelAtPeriodEnd && (
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                <X className="mr-1 h-4 w-4" />
                {t('Cancel')}
              </Button>
            )}
            <Button onClick={() => navigate('../checkout')}>
              {sub.tier === 'free' ? t('Upgrade') : t('Change plan')}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
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
            <UsageBar label={t('AI credits')} used={usage.aiOpsUsed} limit={limits.aiOps ?? 0} />
            <UsageBar label={t('SMS')} used={usage.smsUsed} limit={limits.sms ?? 0} />
            <UsageBar label={t('WhatsApp')} used={usage.whatsappUsed} limit={limits.whatsapp ?? 0} />
            <UsageBar label={t('Voice')} used={usage.voiceMinutesUsed} limit={limits.voiceMinutes ?? 0} unit="min" />
          </div>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Cancel subscription?')}</DialogTitle>
            <DialogDescription>
              {t('You will keep full access until the end of your current billing period. After that your account moves to the Free plan.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>{t('Keep plan')}</Button>
            <Button onClick={doCancel} disabled={busy === 'cancel'}>{t('Confirm cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={downgradeOpen} onOpenChange={setDowngradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Downgrade plan')}</DialogTitle>
            <DialogDescription>
              {t('Downgrade takes effect at the end of your current billing period.')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {lowerTiers.map((tt) => (
              <Button key={tt} variant="outline" onClick={() => doDowngrade(tt)} disabled={busy === 'downgrade'}>
                {t('Downgrade to')} {TIER_LABELS[tt]}
              </Button>
            ))}
            <Button variant="outline" onClick={() => doDowngrade('free')} disabled={busy === 'downgrade'}>
              {t('Downgrade to Free')}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDowngradeOpen(false)}>{t('Cancel')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTitle>
  );
}
