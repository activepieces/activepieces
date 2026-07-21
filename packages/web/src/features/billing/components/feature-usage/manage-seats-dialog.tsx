import { isNil } from '@activepieces/core-utils';
import { BillableFeature, formErrors } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Info, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { billingMutations } from '../../hooks/billing-hooks';

import { DeactivateUsersDialog } from './deactivate-users-dialog';

export const ManageSeatsDialog = ({
  open,
  onOpenChange,
  feature,
  currentUsers,
  includedSeats,
  additionalSeats,
}: ManageSeatsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{t('Manage seats')}</DialogTitle>
        </DialogHeader>
        <ManageSeatsForm
          key={open ? 'seats-open' : 'seats-closed'}
          feature={feature}
          currentUsers={currentUsers}
          includedSeats={includedSeats}
          additionalSeats={additionalSeats}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
};

function ManageSeatsForm({
  feature,
  currentUsers,
  includedSeats,
  additionalSeats,
  onOpenChange,
}: ManageSeatsFormProps) {
  const included = includedSeats ?? 0;
  const [pendingTotal, setPendingTotal] = useState<number | null>(null);

  const form = useForm<ManageSeatsFormValues>({
    resolver: zodResolver(manageSeatsFormSchema),
    defaultValues: {
      additionalSeats: additionalSeats ?? 0,
    },
    mode: 'onChange',
  });

  const { mutate: purchaseSeats, isPending } =
    billingMutations.useAdjustUnconsumableFeatureQuantity(() =>
      onOpenChange(false),
    );

  const value = form.watch('additionalSeats');
  const perSeat = feature.pricePerUnit / feature.billingUnits;
  const totalCost = value * perSeat;
  const isYearly = feature.interval === 'year';

  const submitTotal = (total: number) =>
    purchaseSeats({
      featureId: feature.featureId,
      quantity: total,
    });

  const handleSubmit = (values: ManageSeatsFormValues) => {
    const total = included + values.additionalSeats;
    if (currentUsers > total) {
      setPendingTotal(total);
      return;
    }
    submitTotal(total);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="additionalSeats"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>{t('Additional seats')}</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={field.value <= 0}
                    onClick={() => field.onChange(field.value - 1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    type="number"
                    className="w-20 text-center"
                    min={0}
                    step={1}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => field.onChange(field.value + 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-lg border p-4 bg-primary/5 border-primary/30">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold">
              {isYearly ? t('Total yearly cost') : t('Total monthly cost')}
            </span>
            <span className="text-2xl font-bold text-primary">
              {t('${amount}', { amount: totalCost.toFixed(2) })}
            </span>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {isYearly
              ? t('${price}/year per seat', { price: perSeat.toFixed(2) })
              : t('${price}/month per seat', { price: perSeat.toFixed(2) })}
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          <span>
            {t(
              'Seat changes take effect immediately and are prorated — added seats are charged now, removed seats are credited.',
            )}
          </span>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            loading={isPending}
            disabled={!form.formState.isValid}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>

      <DeactivateUsersDialog
        open={!isNil(pendingTotal)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingTotal(null);
          }
        }}
        targetSeats={pendingTotal ?? 0}
        currentUsers={currentUsers}
        onConfirmed={() => {
          const total = pendingTotal;
          setPendingTotal(null);
          if (!isNil(total)) {
            submitTotal(total);
          }
        }}
      />
    </Form>
  );
}

const manageSeatsFormSchema = z.object({
  additionalSeats: z.number().int().min(0, formErrors.required),
});

type ManageSeatsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: BillableFeature;
  currentUsers: number;
  includedSeats: number | null | undefined;
  additionalSeats: number | null | undefined;
};

type ManageSeatsFormProps = {
  feature: BillableFeature;
  currentUsers: number;
  includedSeats: number | null | undefined;
  additionalSeats: number | null | undefined;
  onOpenChange: (open: boolean) => void;
};

type ManageSeatsFormValues = z.infer<typeof manageSeatsFormSchema>;
