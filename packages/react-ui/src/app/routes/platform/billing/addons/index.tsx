import { t } from 'i18next';
import { CheckIcon, XIcon } from 'lucide-react';
import { FC, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

import { planData } from '../data';

/* ---------- tiny helper ---------- */
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

/* ---------- Plan card ---------- */
const PlanCard: FC<{
  plan: (typeof planData.plans)[0];
  isMonthly: boolean;
  selected: string;
  onSelect: (id: string) => void;
}> = ({ plan, isMonthly, selected, onSelect }) => {
  const isSelected = plan.id === selected;
  const isEnterprise = plan.id === 'enterprise';
  const openNewWindow = useNewWindow();

  // Border styling for selected state
  const border = isSelected ? 'ring-2 ring-primary' : 'ring-0';

  return (
    <div
      onClick={() => !isEnterprise && onSelect(plan.id)}
      className={cn(
        'flex flex-col rounded-lg p-6 transition border cursor-pointer',
        border,
        isEnterprise && 'cursor-default',
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-2xl font-semibold">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
      </div>

      {/* Price */}
      <div className="mt-2 flex items-baseline gap-1">
        {plan.isCustom ? (
          <span className="text-xl font-bold">{plan.salesPrice}</span>
        ) : (
          <span className="text-xl font-bold">
            {isMonthly ? plan.monthlyPrice : plan.yearlyPrice}
          </span>
        )}
      </div>

      {/* CTA */}
      {isEnterprise && (
        <Button
          variant="default"
          size="sm"
          className="mt-4"
          onClick={() => openNewWindow('https://activepieces.com/sales')}
        >
          {t('Contact Sales')}
        </Button>
      )}

      {/* Features - not scrollable */}
      <div className="mt-5">
        <p className="text-sm font-bold mb-3">{t('Includes')}</p>
        <ul className="space-y-4">
          {planData.features.map((feature) => (
            <li key={feature.key} className="flex justify-between text-sm">
              <span>{feature.label}</span>
              <FeatureValue
                v={
                  feature.values[plan.id as keyof typeof feature.values] as
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

/* ---------- Page ---------- */
const PricingPlans: FC = () => {
  const [isMonthly, setIsMonthly] = useState(true);
  const [selected, setSelected] = useState('free');

  return (
    <section className="space-y-6 w-1/2">
      {/* Top bar */}
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('Choose your plan')}</h2>
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
          </Button>
          <div className="inline-flex rounded-md space-x-1 border p-1">
            {planData.tabs.map((tab) => (
              <Button
                key={tab}
                variant="ghost"
                size="sm"
                className={cn(
                  'px-3 rounded-sm',
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

      {/* Cards */}
      <div className="grid grid-cols-2 gap-6">
        {planData.plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isMonthly={isMonthly}
            selected={selected}
            onSelect={setSelected}
          />
        ))}
      </div>
    </section>
  );
};

export default PricingPlans;
