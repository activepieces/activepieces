import { PieceProperty, PropertyGroup } from '@activepieces/pieces-framework';
import { PropertyExecutionType, PropertySettings } from '@activepieces/shared';
import { t } from 'i18next';
import { Info, SquareFunction } from 'lucide-react';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormItem, FormLabel } from '@/components/ui/form';
import { RequiredFieldAsterisk } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formUtils } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { MentionChipsInput } from './mention-chips-input';
import { TextInputWithMentions } from './text-input-with-mentions';

function PropertyGroupTabs({
  group,
  properties,
  prefixValue,
  propertySettings,
  disabled,
}: PropertyGroupTabsProps) {
  const form = useFormContext();
  const tabKeys = group.props.filter((key) => !!properties[key]);
  const [activeKey, setActiveKey] = useState(tabKeys[0]);

  const inputNameFor = (key: string) =>
    prefixValue.length > 0 ? `${prefixValue}.${key}` : key;

  const watched = form.watch(tabKeys.map((key) => inputNameFor(key)));
  const valueByKey = Object.fromEntries(
    tabKeys.map((key, index) => [key, watched[index]]),
  );

  const allowDynamicValues = propertySettings !== null;

  const toggleDynamic = (key: string) => {
    const inputName = inputNameFor(key);
    const nextDynamic = !isDynamicValue(form.getValues(inputName));
    form.setValue(
      `settings.propertySettings.${key}`,
      {
        ...form.getValues().settings?.propertySettings?.[key],
        type: nextDynamic
          ? PropertyExecutionType.DYNAMIC
          : PropertyExecutionType.MANUAL,
      },
      { shouldValidate: true },
    );
    form.setValue(
      inputName,
      formUtils.getDefaultPropertyValue({
        property: properties[key],
        dynamicInputModeToggled: nextDynamic,
      }),
      { shouldValidate: true },
    );
  };

  if (tabKeys.length === 0) {
    return null;
  }

  const anyRequired = tabKeys.some((key) => properties[key].required);
  const safeActiveKey = tabKeys.includes(activeKey) ? activeKey : tabKeys[0];
  const activeDynamic = isDynamicValue(valueByKey[safeActiveKey]);
  const activeFieldState = form.getFieldState(
    inputNameFor(safeActiveKey),
    form.formState,
  );
  const showActiveError =
    !!activeFieldState.error && activeFieldState.isTouched;
  const activeErrorMessage = activeFieldState.error?.message
    ? t(String(activeFieldState.error.message))
    : null;

  return (
    <FormItem className="flex flex-col">
      <FormLabel className="flex items-center gap-1 h-7.5 max-h-7.5">
        <div className="pt-1 flex items-center gap-1">
          <span>{group.label}</span>
          {anyRequired && <RequiredFieldAsterisk />}
        </div>
        {group.description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={group.description}
                className="text-muted-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {group.description}
            </TooltipContent>
          </Tooltip>
        )}

        <span className="grow" />

        {allowDynamicValues && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={activeDynamic}
                onPressedChange={() => toggleDynamic(safeActiveKey)}
                disabled={disabled}
                aria-label={t('Dynamic value')}
                className="shrink-0"
              >
                <SquareFunction
                  className={cn(
                    'size-5',
                    activeDynamic ? 'text-foreground' : 'text-muted-foreground',
                  )}
                />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="top">{t('Dynamic value')}</TooltipContent>
          </Tooltip>
        )}
      </FormLabel>

      <Tabs value={safeActiveKey} onValueChange={setActiveKey}>
        <div className="overflow-hidden rounded-md border border-input bg-background">
          <TabsList className="h-auto w-full gap-1 rounded-none bg-muted/50 p-1">
            {tabKeys.map((key) => {
              const property = properties[key];
              const fieldState = form.getFieldState(
                inputNameFor(key),
                form.formState,
              );
              const hasError = !!fieldState.error && fieldState.isTouched;
              const dynamic = isDynamicValue(valueByKey[key]);
              const count = countItems(valueByKey[key]);
              const active = key === safeActiveKey;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  disabled={disabled}
                  aria-invalid={hasError}
                  className={cn(
                    'flex-1 gap-1.5 rounded-sm px-2 py-1.5 text-sm font-medium transition-[color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=active]:bg-background data-[state=active]:shadow-sm',
                    hasError
                      ? 'text-destructive data-[state=active]:text-destructive'
                      : 'text-muted-foreground hover:text-foreground data-[state=active]:text-foreground',
                  )}
                >
                  <span className="whitespace-nowrap">
                    {property.displayName}
                  </span>
                  {property.required && <RequiredFieldAsterisk />}
                  {dynamic ? (
                    <SquareFunction
                      aria-hidden
                      className={cn(
                        'size-3.5 shrink-0',
                        active ? 'text-foreground' : 'text-muted-foreground/80',
                      )}
                    />
                  ) : count > 0 ? (
                    <span
                      className={cn(
                        'inline-flex min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-xs font-semibold leading-none tabular-nums',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted-foreground/15 text-muted-foreground',
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                  {hasError && (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-destructive"
                      aria-hidden
                    />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabKeys.map((key) => {
            const inputName = inputNameFor(key);
            const dynamic = isDynamicValue(valueByKey[key]);
            return (
              <TabsContent
                key={key}
                value={key}
                className="mt-0 border-t border-input p-2 duration-150 animate-in fade-in-0 motion-reduce:animate-none"
              >
                <div className="min-w-0 py-0.5">
                  {dynamic ? (
                    <TextInputWithMentions
                      disabled={disabled}
                      initialValue={form.getValues(inputName) ?? ''}
                      onChange={(newValue) =>
                        form.setValue(inputName, newValue, {
                          shouldValidate: true,
                        })
                      }
                    />
                  ) : (
                    <MentionChipsInput
                      value={valueByKey[key]}
                      disabled={disabled}
                      onChange={(newValue) =>
                        form.setValue(inputName, newValue, {
                          shouldValidate: true,
                        })
                      }
                    />
                  )}
                </div>
              </TabsContent>
            );
          })}
        </div>
      </Tabs>

      <div aria-live="polite" className="empty:hidden">
        {showActiveError && activeErrorMessage && (
          <p className="text-sm font-medium text-destructive wrap-break-word">
            {activeErrorMessage}
          </p>
        )}
      </div>
    </FormItem>
  );
}

PropertyGroupTabs.displayName = 'PropertyGroupTabs';

function isDynamicValue(value: unknown): boolean {
  return typeof value === 'string';
}

function countItems(value: unknown): number {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim().length > 0)
        .length
    : 0;
}

export { PropertyGroupTabs };

type PropertyGroupTabsProps = {
  group: PropertyGroup;
  properties: Record<string, PieceProperty>;
  prefixValue: string;
  propertySettings: Record<string, PropertySettings> | null;
  disabled: boolean;
};
