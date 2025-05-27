import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { CheckIcon, ChevronLeft, ExternalLinkIcon, XIcon } from 'lucide-react';
import { FC, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';
import {
  BilingCycle,
  PaymentTiming,
  PlanName,
  ProrationBehavior,
  Addons,
  planData,
} from '@activepieces/ee-shared';

import { platformBillingApi } from '../api/billing-api';

import AddonsCustomizer from './addons';

const FeatureValue: FC<{ v: boolean | string }> = ({ v }) =>
  typeof v === 'boolean' ? (
    v ? (
      <CheckIcon className="h-4 w-4 text-green-600" />
    ) : (
      <XIcon className="h-4 w-4 text-red-500" />
    )
  ) : (
    <span className="text-sm">{v}</span>
  );

const PlanCard: FC<{
  plan: (typeof planData.plans)[0];
  isMonthly: boolean;
  selected: PlanName;
  onSelect: (naem: PlanName) => void;
}> = ({ plan, isMonthly, selected, onSelect }) => {
  const isSelected = plan.name === selected;
  const isEnterprise = plan.name === PlanName.ENTERPRISE;
  const openNewWindow = useNewWindow();

  const border = isSelected ? 'ring-2 ring-primary' : 'ring-0';

  return (
    <div
      onClick={() => !isEnterprise && onSelect(plan.name as PlanName)}
      className={cn(
        'flex flex-col rounded-lg p-6 transition border cursor-pointer',
        border,
        isEnterprise && 'cursor-default',
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-2xl font-semibold">
            {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
          </h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        {plan.isCustom ? (
          <span className="text-xl font-bold">{plan.salesPrice}</span>
        ) : (
          <span className="text-xl font-bold">
            {isMonthly ? plan.monthlyPrice : plan.yearlyPrice}
          </span>
        )}
      </div>

      {isEnterprise && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => openNewWindow('https://activepieces.com/sales')}
        >
          {t('Contact Sales')}
        </Button>
      )}

      <div className="mt-5">
        <p className="text-sm font-bold mb-3">{t('Includes')}</p>
        <ul className="space-y-4">
          {planData.features.map((feature) => (
            <li key={feature.key} className="flex justify-between text-sm">
              <span>{feature.label}</span>
              <FeatureValue
                v={
                  feature.values[plan.name as keyof typeof feature.values] as
                    | boolean
                    | string
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const UpgradePage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openNewWindow = useNewWindow();

  const getInitialMonthly = () => {
    const billing = searchParams.get('billing');
    return billing === BilingCycle.ANNUAL ? false : true;
  };

  const getInitialSelected = () => {
    const plan = searchParams.get('plan') as PlanName;
    return plan || PlanName.FREE;
  };
  const [isMonthly, setIsMonthly] = useState(getInitialMonthly);
  const [selected, setSelected] = useState(getInitialSelected);
  const [selectedAddons, setSelectedAddons] = useState<Addons>({});

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('plan', selected);
    newParams.set(
      'billing',
      isMonthly ? BilingCycle.MONTHLY : BilingCycle.ANNUAL,
    );
    setSearchParams(newParams, { replace: true });
  }, [selected, isMonthly, searchParams, setSearchParams]);

  useEffect(() => {
    const planParam = searchParams.get('plan') as PlanName;
    const billingParam = searchParams.get('billing');

    if (planParam && planParam !== selected) {
      setSelected(planParam);
    }

    if (billingParam) {
      const shouldBeMonthly = billingParam !== BilingCycle.ANNUAL;
      if (shouldBeMonthly !== isMonthly) {
        setIsMonthly(shouldBeMonthly);
      }
    }
  }, [searchParams]);

  const constructUpgradeData = () => {
    return {
      plan: selected as PlanName.PLUS | PlanName.BUSINESS,
      billing: isMonthly ? BilingCycle.MONTHLY : BilingCycle.ANNUAL,
      addons: selectedAddons,
      paymentTiming: PaymentTiming.IMMEDIATE,
      prorationBehavior: ProrationBehavior.CREATE_PRORATIONS,
    };
  };

  const { mutate: upgradePlan } = useMutation({
    mutationFn: async () => {
      const { paymentLink } = await platformBillingApi.upgrade(
        constructUpgradeData(),
      );
      openNewWindow(paymentLink);
    },
    onSuccess: () => {
      toast.success('Plan upgraded successfully');
    },
    onError: () => {
      toast.error('Failed to upgrade plan');
    },
  });

  return (
    <article className="flex flex-col w-full gap-8">
      <div>
        <div className="flex items-center gap-2">
          <Link to="/platform/setup/billing">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Upgrade Plan</h1>
        </div>
      </div>

      <section className="flex gap-8 justify-between w-full">
        <PricingPlans
          isMonthly={isMonthly}
          setIsMonthly={setIsMonthly}
          selected={selected}
          setSelected={setSelected}
        />
        <div className="flex-1 h-fit sticky top-6">
          <AddonsCustomizer
            selectedPlan={selected}
            isMonthly={isMonthly}
            handleAddonsChange={setSelectedAddons}
            upgradePlan={upgradePlan}
          />
        </div>
      </section>
    </article>
  );
};

export default UpgradePage;

const PricingPlans: FC<{
  isMonthly: boolean;
  setIsMonthly: (isMonthly: boolean) => void;
  selected: PlanName;
  setSelected: (selected: PlanName) => void;
}> = ({ isMonthly, setIsMonthly, selected, setSelected }) => {
  return (
    <div className="space-y-6 w-[55%]">
      <header className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('Choose Your Plan')}</h2>
        <div>
          <Button
            variant="link"
            size="sm"
            className="ml-2"
            onClick={() =>
              window.open('https://activepieces.com/pricing', '_blank')
            }
          >
            {t('See all features')}
            <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </Button>
          <div className="inline-flex rounded-md space-x-1 border p-1">
            {planData.tabs.map((tab) => (
              <Button
                key={tab}
                variant="ghost"
                size="xs"
                className={cn(
                  'text-sm font-medium',
                  (tab === t('Monthly') && isMonthly) ||
                    (tab === t('Annual') && !isMonthly)
                    ? 'bg-secondary'
                    : '',
                )}
                onClick={() => setIsMonthly(tab === t('Monthly'))}
              >
                {tab}
                {tab !== t('Monthly') && (
                  <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                    {planData.plans[1].yearlyDiscount}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {planData.plans.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            isMonthly={isMonthly}
            selected={selected}
            onSelect={setSelected}
          />
        ))}
      </div>
    </div>
  );
};
