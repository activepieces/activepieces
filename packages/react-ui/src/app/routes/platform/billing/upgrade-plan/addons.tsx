import { t } from 'i18next';
import { ArrowRightIcon, LockIcon } from 'lucide-react';
import { FC, useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

import NumberInputWithButtons from '@/components/ui/number-input';
import { planData } from '../data';

interface AddonsCustomizerProps {
  selectedPlan: string;
  isMonthly: boolean;
}

const AddonsCustomizer: FC<AddonsCustomizerProps> = ({
  selectedPlan,
  isMonthly,
}) => {
  const [extraUsers, setExtraUsers] = useState(0);
  const [extraFlows, setExtraFlows] = useState(0);
  const [extraAiCredits, setExtraAiCredits] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const PRICE_PER_USER = 10;
  const PRICE_PER_FLOW = 5;
  const PRICE_PER_100_AI_CREDITS = 10;

  const plan = planData.plans.find((p) => p.id === selectedPlan);
  const isFreePlan = selectedPlan === 'free';
  const isEnterprisePlan = selectedPlan === 'enterprise';

  useEffect(() => {
    if (!plan || plan.isCustom) {
      setBasePrice(0);
      return;
    }

    try {
      const priceString = isMonthly ? plan.monthlyPrice : plan.yearlyPrice;
      const numericPrice = parseFloat(
        (priceString || '$0').replace(/[^0-9.]/g, ''),
      );
      setBasePrice(numericPrice || 0);
    } catch (error) {
      console.error('Error parsing price:', error);
      setBasePrice(0);
    }

    if (isFreePlan || isEnterprisePlan) {
      setExtraUsers(0);
      setExtraFlows(0);
      setExtraAiCredits(0);
    }
  }, [plan, isMonthly, isFreePlan, isEnterprisePlan]);

  useEffect(() => {
    const userCost = extraUsers * PRICE_PER_USER;
    const flowCost = extraFlows * PRICE_PER_FLOW;
    const aiCreditsCost = (extraAiCredits / 100) * PRICE_PER_100_AI_CREDITS;

    setTotalPrice(basePrice + userCost + flowCost + aiCreditsCost);
  }, [basePrice, extraUsers, extraFlows, extraAiCredits]);

  const handleAiCreditsChange = (value: number[]) => {
    setExtraAiCredits(value[0]);
  };

  if (!plan) return null;

  return (
    <Card className="w-full h-full">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('Customize Your Plan')}</CardTitle>
            <CardDescription>
              {isFreePlan
                ? t('Upgrade to a paid plan to customize add-ons')
                : isEnterprisePlan
                ? t('Contact sales for custom add-ons')
                : t('Add extra resources to your plan')}
            </CardDescription>
          </div>
          {isFreePlan && (
            <Badge variant="outline" className="gap-1 py-1.5">
              <LockIcon className="h-3.5 w-3.5" />
              {t('Locked')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex justify-between items-center border-b pb-4">
          <span className="font-semibold">
            {t('Base Plan')}: {plan.name}
          </span>
          <span className="text-xl font-bold">
            {plan.isCustom
              ? plan.salesPrice
              : isMonthly
              ? plan.monthlyPrice
              : plan.yearlyPrice}
          </span>
        </div>

        <div
          className={`space-y-6 ${
            isFreePlan || isEnterprisePlan ? 'opacity-60' : ''
          }`}
        >
          <div className="space-y-2 p-3 rounded-md bg-muted/20 border">
            <div className="flex justify-between">
              <span className="font-medium text-sm">{t('Extra Users')}</span>
              <span className="text-sm text-muted-foreground">
                ${PRICE_PER_USER} {t('/mo per extra user')}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4 pt-1">
              <NumberInputWithButtons
                value={extraUsers}
                onChange={setExtraUsers}
                min={0}
                max={100}
                disabled={isFreePlan || isEnterprisePlan}
              />
              <span
                className={`text-sm ${
                  extraUsers > 0
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {extraUsers > 0 ? `+$${extraUsers * PRICE_PER_USER}` : '+$0'}
              </span>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-md bg-muted/20 border">
            <div className="flex justify-between">
              <span className="font-medium text-sm">
                {t('Extra Active Flows')}
              </span>
              <span className="text-sm text-muted-foreground">
                ${PRICE_PER_FLOW} {t('/mo per extra active flow')}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4 pt-1">
              <NumberInputWithButtons
                value={extraFlows}
                onChange={setExtraFlows}
                min={0}
                max={200}
                disabled={isFreePlan || isEnterprisePlan}
              />
              <span
                className={`text-sm ${
                  extraFlows > 0
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {extraFlows > 0 ? `+$${extraFlows * PRICE_PER_FLOW}` : '+$0'}
              </span>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-md bg-muted/20 border">
            <div className="flex justify-between">
              <span className="font-medium text-sm">
                {t('Extra AI Credits')}
              </span>
              <span className="text-sm text-muted-foreground">
                ${PRICE_PER_100_AI_CREDITS} {t('per extra 100 credits')}
              </span>
            </div>
            <div className="space-y-4 py-2">
              <Slider
                value={[extraAiCredits]}
                onValueChange={handleAiCreditsChange}
                max={1000}
                step={100}
                disabled={isFreePlan || isEnterprisePlan}
              />
              <div className="flex justify-between">
                <span className="text-xs">
                  {extraAiCredits} {t('credits')}
                </span>
                <span
                  className={`text-sm ${
                    extraAiCredits > 0
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {extraAiCredits > 0
                    ? `+$${(extraAiCredits / 100) * PRICE_PER_100_AI_CREDITS}`
                    : '+$0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 mt-8">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">{t('Total')}</span>
            <div className="text-right flex items-center gap-x-1">
              <span className="text-2xl font-bold">
                ${totalPrice.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground block">
                {isMonthly ? t('/mo') : t('/mo, billed annually')}
              </span>
            </div>
          </div>
        </div>

        <Button className="w-full" disabled={isFreePlan || isEnterprisePlan}>
          {t('Continue to checkout')}
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default AddonsCustomizer;