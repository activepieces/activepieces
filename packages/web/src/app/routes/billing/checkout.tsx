import { t } from 'i18next';
import { Check } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageTitle } from '@/app/components/page-title';
import { Button } from '@/components/ui/button';
import { synkraBillingHooks } from '@/features/synkra-billing';

type PaidTier = 'starter' | 'business' | 'pro';

const TIERS: {
  tier: PaidTier;
  name: string;
  price: number;
  features: string[];
}[] = [
  {
    tier: 'starter',
    name: 'Starter',
    price: 299,
    features: ['3 seats', '1 workspace', '15,000 executions/mo', '10 GB storage', '2,000 emails/mo'],
  },
  {
    tier: 'business',
    name: 'Business',
    price: 599,
    features: ['10 seats', '3 workspaces', '50,000 executions/mo', '50 GB storage', 'SSO, API keys, audit logs'],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 999,
    features: ['25 seats', '10 workspaces', '150,000 executions/mo', '200 GB storage', 'White-label'],
  },
];

export function BillingCheckoutPage() {
  const checkout = synkraBillingHooks.useCheckout();
  const navigate = useNavigate();

  const handleSelect = (tier: PaidTier) => {
    checkout.mutate(
      { tier, callbackUrl: window.location.origin + window.location.pathname.replace(/\/checkout$/, '') },
      {
        onSuccess: (data) => {
          window.location.href = data.authorizationUrl;
        },
        onError: () => toast.error(t('Could not start checkout. Please try again.')),
      },
    );
  };

  return (
    <PageTitle title={t('Choose a plan')}>
      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">{t('Choose a plan')}</h1>
          <Button variant="outline" onClick={() => navigate('..')}>
            {t('Back')}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS.map((p) => (
            <div key={p.tier} className="rounded-lg border bg-white p-6 flex flex-col gap-4">
              <div>
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="mt-2 text-3xl font-bold">
                  R{p.price}
                  <span className="ml-1 text-sm font-normal text-gray-11">{t('/month')}</span>
                </div>
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-auto"
                onClick={() => handleSelect(p.tier)}
                disabled={checkout.isPending}
              >
                {checkout.isPending ? t('Starting…') : t('Subscribe')}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </PageTitle>
  );
}
