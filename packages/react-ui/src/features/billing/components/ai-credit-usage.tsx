import { t } from 'i18next';
import { Sparkles, Info } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { PlanName } from '@activepieces/ee-shared';
import { PlatformBillingInformation } from '@activepieces/shared';

export function AICreditUsage({
  platformSubscription,
}: {
  platformSubscription: PlatformBillingInformation;
}) {
  const { plan, usage } = platformSubscription;
  const aiLimit = plan.aiCreditsLimit ?? 0;
  const isFreePlan = plan.plan === PlanName.FREE;
  const [usageBasedEnabled, setUsageBasedEnabled] = useState(false);
  const [usageLimit, setUsageLimit] = useState('1000');

  const handleSave = () => {
    console.log('Saving usage limit:', usageLimit);
  };

  const currentUsage = usage.aiCredits || 0;
  const usagePercentage = Math.round((currentUsage / aiLimit) * 100);

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('AI Credits')}</h3>
              <p className="text-sm text-muted-foreground">
                Manage your AI usage and limits
              </p>
            </div>
          </div>
          {!isFreePlan && (
            <div className="flex items-center gap-3 py-2">
              <span className="text-sm font-medium">
                {t('Usage Based Billing')}
              </span>
              <Switch
                checked={usageBasedEnabled}
                onCheckedChange={setUsageBasedEnabled}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-10">
        {/* Current Usage Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-medium">{t('Current Usage')}</h4>
            <div className="group relative">
              <Info className="w-4 h-4 text-muted-foreground" />
              <div className="invisible group-hover:visible absolute left-0 top-6 bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 whitespace-nowrap z-10 border shadow-md">
                Credits reset monthly with your billing cycle
              </div>
            </div>
          </div>

          <div className="rounded-lg space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {currentUsage} / {aiLimit}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {t('Plan Limit')}
              </span>
            </div>
            <Progress
              value={(currentUsage / aiLimit) * 100}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {usagePercentage}% of monthly allocation used
              </span>
              {usagePercentage > 80 && (
                <span className="text-destructive font-medium">
                  Approaching limit
                </span>
              )}
            </div>
          </div>
        </div>

        {usageBasedEnabled && !isFreePlan && (
          <>
            <Separator />

            {/* Usage Based Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-medium">
                  {t('Usage Based Credits')}
                </h4>
              </div>

              <div className="rounded-lg space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {currentUsage} / {parseInt(usageLimit) || 1000}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('Usage Limit')}
                  </span>
                </div>
                <Progress
                  value={(currentUsage / (parseInt(usageLimit) || 1000)) * 100}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Additional charges apply beyond your plan limit
                </p>
              </div>
            </div>

            <Separator />

            {/* Limit Setting Section */}
            <div className="space-y-4">
              <div>
                <h5 className="text-base font-medium mb-1">
                  {t('Set Usage Limit')}
                </h5>
                <p className="text-sm text-muted-foreground">
                  Set a maximum number of AI credits to prevent unexpected
                  charges
                </p>
              </div>

              <div className="rounded-lg space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1 max-w-xs space-y-2">
                    <Input
                      type="number"
                      placeholder="Enter limit"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={handleSave} className="whitespace-nowrap">
                    {t('Save Limit')}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Recommended: Set 20-50% above your expected monthly usage
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              {t('$0.01 per additional credit beyond plan limit')}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
