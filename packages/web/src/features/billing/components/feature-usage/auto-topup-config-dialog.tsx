import {
  ConsumableProductAutoTopupParams,
  AiCreditsAutoTopUpState,
  ToppableFeature,
  isNil,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { billingMutations } from '../../hooks/billing-hooks';

export function AutoTopUpConfigDialog({
  isOpen,
  onOpenChange,
  feature,
  includedCredits,
  currentThreshold,
  currentCreditsToAdd,
  currentMaxMonthlyTopUps,
}: AutoTopUpConfigDialogProps) {
  const queryClient = useQueryClient();

  const simpleCap = Math.max(SIMPLE_BASE, Math.floor(includedCredits / 2));
  const creditOptions = simpleCreditOptions(simpleCap);

  const form = useForm<AutoTopUpFormValues>({
    resolver: zodResolver(AutoTopUpFormSchema),
    defaultValues: {
      threshold: nearestOption(
        currentThreshold ?? feature.billingUnits,
        creditOptions,
      ),
      creditsToAdd: nearestOption(
        currentCreditsToAdd ?? DEFAULT_CREDITS_TO_ADD,
        creditOptions,
      ),
      maxMonthlyTopUps: normalizeTopUps(currentMaxMonthlyTopUps),
    },
    mode: 'onChange',
  });

  const { mutate: updateAutoTopUp, isPending } =
    billingMutations.useUpdateAutoTopUp(queryClient);

  const creditsToAdd = form.watch('creditsToAdd');
  const costPerTopUp =
    (creditsToAdd / feature.billingUnits) * feature.pricePerUnit;

  const handleSave = (values: AutoTopUpFormValues) => {
    const params: ConsumableProductAutoTopupParams = {
      minThreshold: values.threshold,
      creditsToAdd: values.creditsToAdd,
      maxMonthlyTopUps: values.maxMonthlyTopUps,
      state: AiCreditsAutoTopUpState.ENABLED,
      featureId: feature.featureId,
    };

    updateAutoTopUp(params, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('Auto recharge')}</DialogTitle>
          <DialogDescription>
            {t('Automatically purchase credits when your balance runs low.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-6 py-4"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="threshold"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t('When credits below')}</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {creditOptions.map((option) => (
                          <SelectItem key={option} value={String(option)}>
                            {option.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditsToAdd"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t('Add credits')}</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {creditOptions.map((option) => (
                          <SelectItem key={option} value={String(option)}>
                            {option.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxMonthlyTopUps"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t('Monthly spending limit')}</FormLabel>
                    <Select
                      value={
                        isNil(field.value)
                          ? UNLIMITED_VALUE
                          : String(field.value)
                      }
                      onValueChange={(value) =>
                        field.onChange(
                          value === UNLIMITED_VALUE ? null : Number(value),
                        )
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHLY_TOPUP_OPTIONS.map((count) => (
                          <SelectItem key={count} value={String(count)}>
                            {t(
                              '${cost} ({count, plural, =1 {1 auto recharge} other {# auto recharges}})',
                              {
                                cost: (count * costPerTopUp).toFixed(2),
                                count,
                              },
                            )}
                          </SelectItem>
                        ))}
                        <SelectItem value={UNLIMITED_VALUE}>
                          {t('No limit')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border p-4 bg-primary/5 border-primary/30">
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold">
                    {t('Payment per auto recharge')}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {t('${totalCost}', { totalCost: costPerTopUp.toFixed(2) })}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {t('${cost} per {units} credits', {
                    cost: feature.pricePerUnit,
                    units: feature.billingUnits.toLocaleString(),
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="size-3.5 mt-0.5 shrink-0" />
              <span>
                {t(
                  'Changes apply on your next usage — credits are topped up the next time your balance falls below the threshold, not immediately when you save.',
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
              <Button type="submit" loading={isPending}>
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Simple-mode credit options: start at 1,000, then every 5,000 up to the cap (½ of the plan's included credits).
function simpleCreditOptions(cap: number): number[] {
  const options = [SIMPLE_BASE];
  for (let value = SIMPLE_STEP; value <= cap; value += SIMPLE_STEP) {
    options.push(value);
  }
  return options;
}

function nearestOption(value: number, options: number[]): number {
  return options.reduce(
    (best, option) =>
      Math.abs(option - value) < Math.abs(best - value) ? option : best,
    options[0],
  );
}

function normalizeTopUps(value: number | null | undefined): number | null {
  if (isNil(value)) {
    return null;
  }
  return MONTHLY_TOPUP_OPTIONS.includes(value)
    ? value
    : nearestOption(value, MONTHLY_TOPUP_OPTIONS);
}

const DEFAULT_CREDITS_TO_ADD = 1000;
const SIMPLE_BASE = 1000;
const SIMPLE_STEP = 5000;
const MONTHLY_TOPUP_OPTIONS = [1, 2, 4, 6];
const UNLIMITED_VALUE = 'unlimited';

const AutoTopUpFormSchema = z.object({
  threshold: z.number(),
  creditsToAdd: z.number(),
  maxMonthlyTopUps: z.number().nullable(),
});

interface AutoTopUpConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  feature: ToppableFeature;
  includedCredits: number;
  currentThreshold?: number | null;
  currentCreditsToAdd?: number | null;
  currentMaxMonthlyTopUps?: number | null;
}

type AutoTopUpFormValues = z.infer<typeof AutoTopUpFormSchema>;
