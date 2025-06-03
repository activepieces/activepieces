import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useDialogStore } from '@/lib/dialogs-store';
import { PlanName, PRICE_PER_EXTRA_USER } from '@activepieces/ee-shared';

import { billingMutations } from '../lib/billing-hooks';

export const ExtraSeatsDialog = () => {
  const { setDialog, dialogs } = useDialogStore();

  const [extraSeats, setExtraSeats] = useState([1]);
  const seatCount = extraSeats[0];
  const totalMonthlyCost = seatCount * PRICE_PER_EXTRA_USER;

  const queryClient = useQueryClient();
  const { mutate: addUserSeats, isPending } =
    billingMutations.useUpdateSubscription(
      () => setDialog('addUserSeats', false),
      queryClient,
    );

  return (
    <Dialog
      open={dialogs.addUserSeats}
      onOpenChange={(open) => setDialog('addUserSeats', open)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Add Extra Seats
          </DialogTitle>
          <DialogDescription>
            Expand your team capacity with additional user seats
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                Number of extra seats
              </label>
              <p className="text-lg font-bold px-3 py-1">{seatCount}</p>
            </div>

            <div className="space-y-3">
              <Slider
                value={extraSeats}
                onValueChange={setExtraSeats}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 seat</span>
                <span>20 seats</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">
                  {t('Additional Monthly cost')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {seatCount} seat{seatCount > 1 ? 's' : ''} × $
                  {PRICE_PER_EXTRA_USER}
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">
                ${totalMonthlyCost}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setDialog('addUserSeats', false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              addUserSeats({ extraUsers: seatCount, plan: PlanName.BUSINESS })
            }
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding Seats
              </>
            ) : (
              'Add Seats'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
