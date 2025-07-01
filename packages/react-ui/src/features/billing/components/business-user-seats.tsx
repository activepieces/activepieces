import { t } from 'i18next';
import { CircleHelp, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TooltipContent,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlatformBillingInformation } from '@activepieces/shared';

import { ExtraSeatsDialog } from './extra-user-seats-dialog';

type BusinessUserSeatsProps = {
  platformSubscription: PlatformBillingInformation;
};

export function BusinessUserSeats({
  platformSubscription,
}: BusinessUserSeatsProps) {
  const [addUserSeatsOpen, setAddUserSeatsOpen] = useState(false);
  const { plan, usage } = platformSubscription;
  const currentSeats = usage.seats || 0;
  const seatsLimit = plan.userSeatsLimit ?? 5;
  const usagePercentage =
    seatsLimit > 0 ? Math.round((currentSeats / seatsLimit) * 100) : 0;

  return (
    <>
      <ExtraSeatsDialog
        open={addUserSeatsOpen}
        onOpenChange={setAddUserSeatsOpen}
        platformSubscription={platformSubscription}
      />
      <Card className="w-full">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg border">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('User Seats')}</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your user seats usage
                </p>
              </div>
            </div>

            <Button variant="link" onClick={() => setAddUserSeatsOpen(true)}>
              {t('Extra Seats?')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-medium">{t('User Seats Usage')}</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CircleHelp className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t('Count of user seats 10$ for extra 1 user seat')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="rounded-lg space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {currentSeats.toLocaleString()}{' '}
                  {`/ ${seatsLimit.toLocaleString()}`}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {t('Plan Limit')}
                </span>
              </div>

              <Progress value={usagePercentage} className="w-full" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {`${usagePercentage}% of plan allocation used`}
                </span>
                {usagePercentage > 80 && (
                  <span className="text-destructive font-medium">
                    Approaching limit
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
