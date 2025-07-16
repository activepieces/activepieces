import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import { PlanName, PRICE_PER_EXTRA_USER } from '@activepieces/ee-shared';
import { PlatformBillingInformation } from '@activepieces/shared';

import { billingMutations } from '../lib/billing-hooks';

const MAX_SEATS = 20;
const DEFAULT_SEATS = 5;

type ExtraSeatsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platformSubscription: PlatformBillingInformation;
};

export const ExtraSeatsDialog = ({
  open,
  onOpenChange,
  platformSubscription,
}: ExtraSeatsDialogProps) => {
  const { plan } = platformSubscription;

  const currentUserLimit = plan.userSeatsLimit ?? DEFAULT_SEATS;
  const [selectedSeats, setSelectedSeats] = useState([currentUserLimit]);

  const newSeatCount = selectedSeats[0];
  const seatDifference = newSeatCount - currentUserLimit;
  const costDifference = seatDifference * PRICE_PER_EXTRA_USER;

  const { mutate: updateUserSeats, isPending } =
    billingMutations.useUpdateSubscription(() => onOpenChange(false));

  useEffect(() => {
    setSelectedSeats([currentUserLimit]);
  }, [currentUserLimit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Manage User Seats
          </DialogTitle>
          <DialogDescription>
            Adjust your team&apos;s capacity by modifying the number of user
            seats.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                Total number of seats
              </label>
              <p className="text-lg font-bold px-3 py-1">{newSeatCount}</p>
            </div>
            <div className="space-y-3">
              <Slider
                value={selectedSeats}
                onValueChange={setSelectedSeats}
                max={MAX_SEATS}
                min={DEFAULT_SEATS}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{DEFAULT_SEATS} seats (minimum)</span>
                <span>{MAX_SEATS} seats (maximum)</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Current seats: {currentUserLimit}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">
                  {costDifference >= 0
                    ? 'Additional Monthly Cost'
                    : 'Monthly Savings'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.abs(seatDifference)} seat
                  {Math.abs(seatDifference) !== 1 ? 's' : ''} × $
                  {PRICE_PER_EXTRA_USER}
                </div>
              </div>
              <div
                className={`text-2xl font-bold ${
                  costDifference >= 0 ? 'text-primary' : 'text-green-600'
                }`}
              >
                {costDifference >= 0 ? '+' : '-'}${Math.abs(costDifference)}
              </div>
            </div>
          </div>

          {seatDifference < 0 && (
            <div className="text-xs text-muted-foreground">
              You will be charged a prorated amount for the remaining days of
              the month.
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              updateUserSeats({
                seats: newSeatCount,
                plan: PlanName.BUSINESS,
              })
            }
            disabled={isPending || newSeatCount === currentUserLimit}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating Seats
              </>
            ) : (
              'Update Seats'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
