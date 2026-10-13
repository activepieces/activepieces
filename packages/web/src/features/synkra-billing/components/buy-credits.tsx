import { t } from 'i18next';
import { Check, Sparkles, Package } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { synkraBillingHooks } from '../hooks';

export function BuyCredits() {
  const { data: packsData } = synkraBillingHooks.useCreditPacks();
  const { data: balance } = synkraBillingHooks.useCreditBalance();
  const purchase = synkraBillingHooks.usePurchaseCredits();
  const qc = useQueryClient();
  const [activeKind, setActiveKind] = useState<'ai' | 'email'>('ai');

  const packs = (packsData?.packs ?? []).filter((p) => p.kind === activeKind);

  const handleBuy = (packId: string) => {
    purchase.mutate(
      { packId, callbackUrl: window.location.origin + '/billing' },
      {
        onSuccess: (data) => {
          window.location.href = data.authorizationUrl;
        },
        onError: (err: Error) => {
          const msg = err?.message || '';
          if (/paystack|not configured/i.test(msg)) {
            toast.error(t('Payments are not yet enabled.'));
          } else {
            toast.error(t('Could not start purchase. Please try again.'));
          }
        },
      },
    );
  };

  return (
    <div className="rounded-lg border bg-white p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-medium flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-11" />
            {t('Buy credits')}
          </h2>
          <p className="text-sm text-gray-11 mt-1">
            {t(
              'Add-on packs sit alongside your plan allowance. Used after your plan credits are exhausted.',
            )}
          </p>
        </div>
      </div>

      {/* Current balances */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border bg-gray-2 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-11">
            <Sparkles className="h-3 w-3" />
            {t('AI credits available')}
          </div>
          <div className="text-xl font-semibold mt-1 tabular-nums">
            {(balance?.ai ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border bg-gray-2 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-11">
            <Package className="h-3 w-3" />
            {t('Email credits available')}
          </div>
          <div className="text-xl font-semibold mt-1 tabular-nums">
            {(balance?.email ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['ai', 'email'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setActiveKind(k)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeKind === k
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-11 hover:text-gray-12',
            )}
          >
            {k === 'ai' ? t('AI credits') : t('Emails')}
          </button>
        ))}
      </div>

      {/* Packs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {packs.map((p) => (
          <div
            key={p.id}
            className="rounded-md border p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="font-medium text-sm">{p.label}</div>
              <div className="text-xs text-gray-11 mt-0.5">{p.description}</div>
            </div>
            <div className="text-2xl font-semibold">
              R{p.priceZar.toLocaleString()}
            </div>
            <Button
              size="sm"
              onClick={() => handleBuy(p.id)}
              disabled={purchase.isPending}
              className="w-full"
            >
              {t('Buy pack')}
            </Button>
          </div>
        ))}
      </div>

      {/* Active lots */}
      {balance && balance.lots.length > 0 && (
        <div className="rounded-md border bg-gray-2 p-3 flex flex-col gap-2">
          <div className="text-xs text-gray-11 font-medium">
            {t('Your credit lots')}
          </div>
          <div className="flex flex-col divide-y">
            {balance.lots.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-1.5 text-xs">
                <span className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-10" />
                  <span className="font-medium">
                    {l.kind === 'ai' ? 'AI' : 'Email'}
                  </span>
                  <span className="text-gray-11">
                    {l.remaining.toLocaleString()} / {l.purchased.toLocaleString()}
                  </span>
                </span>
                <span className="text-gray-11">
                  {t('expires')} {new Date(l.expiresAt).toLocaleDateString('en-ZA')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
