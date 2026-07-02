import {
  ConsumableProductAutoTopupParams,
  AiCreditsAutoTopUpState,
  ToppableFeature,
  isNil,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronsUpDown, Info } from 'lucide-react';
import { useState } from 'react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
      <DialogContent className="max-w-[480px] gap-2">
        <DialogHeader>
          <DialogTitle>{t('Auto recharge')}</DialogTitle>
          <DialogDescription>
            {t('Automatically purchase credits when your balance runs low.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
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
                    <FormControl>
                      <CreditsAmountSelect
                        value={field.value}
                        options={creditOptions}
                        onChange={field.onChange}
                      />
                    </FormControl>
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
                  'Changes apply on your next usage — credits are charged the next time your balance falls below the threshold, not immediately when you save.',
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

function CreditsAmountSelect({
  value,
  options,
  onChange,
}: {
  value: number;
  options: number[];
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const pick = (amount: number) => {
    onChange(amount);
    setOpen(false);
    setCustom('');
  };

  const commitCustom = () => {
    const parsed = Number(custom);
    if (custom.trim() === '' || !Number.isFinite(parsed)) {
      return;
    }
    pick(clampToStep(parsed));
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          commitCustom();
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          )}
        >
          <span>{value.toLocaleString()}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-1"
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => pick(option)}
            className="flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-accent"
          >
            {option.toLocaleString()}
          </button>
        ))}
        <div className="mt-1 flex items-center gap-2 rounded-md border border-input px-3 py-2 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
          <input
            type="number"
            min={CREDITS_MIN}
            max={CREDITS_MAX}
            step={CREDITS_STEP}
            value={custom}
            onChange={(e) => {
              const raw = e.target.value;
              setCustom(raw);
              const parsed = Number(raw);
              if (raw.trim() !== '' && Number.isFinite(parsed)) {
                onChange(parsed);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitCustom();
              }
            }}
            onBlur={commitCustom}
            placeholder={t('Custom amount')}
            className="w-full bg-transparent text-sm outline-none"
          />
          <span className="shrink-0 text-sm text-muted-foreground">
            {t('credits')}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function clampToStep(value: number): number {
  const snapped = Math.round(value / CREDITS_STEP) * CREDITS_STEP;
  return Math.min(CREDITS_MAX, Math.max(CREDITS_MIN, snapped));
}

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
const CREDITS_MIN = 1000;
const CREDITS_MAX = 1000000;
const CREDITS_STEP = 1000;
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
