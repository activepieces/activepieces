import {
  PieceProperty,
  PropertyGroup,
  PropertyType,
} from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { Check, Filter, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { FormField } from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { filterPropertyUtils } from './filter-property-utils';
import { NumberStepper } from './number-stepper';
import { propertyIcons } from './property-icons';

const { inputNameFor, isFilterActive, emptyValueFor, collectRevealedNames } =
  filterPropertyUtils;

function FilterBuilderLayout({
  groups,
  props,
  prefixValue,
  disabled,
  renderField,
}: FilterBuilderLayoutProps) {
  const form = useFormContext();
  const builderGroups = groups.filter((group) => group.display === 'builder');
  const footerGroup = groups.find((group) => group.display === 'footer');

  const revealedNames = new Set(collectRevealedNames(props));
  const filterNames = builderGroups.flatMap((group) =>
    group.props.filter((name) => !!props[name] && !revealedNames.has(name)),
  );

  const watchedValues = form.watch(
    filterNames.map((name) => inputNameFor(prefixValue, name)),
  );
  const activeByValue = new Set(
    filterNames.filter((name, index) =>
      isFilterActive(props[name], watchedValues[index]),
    ),
  );

  // Rows render in the order they were opened. Seeded once from the filters
  // that already hold a value (declared order is the stable baseline on reopen),
  // then newly added filters append to the bottom.
  const [order, setOrder] = useState<string[]>(() =>
    filterNames.filter((name) =>
      isFilterActive(
        props[name],
        form.getValues(inputNameFor(prefixValue, name)),
      ),
    ),
  );
  const openNames = [
    ...order.filter((name) => filterNames.includes(name)),
    ...filterNames.filter(
      (name) => activeByValue.has(name) && !order.includes(name),
    ),
  ];
  const openSet = new Set(openNames);

  const addFilter = (name: string) => {
    setOrder((prev) => (prev.includes(name) ? prev : [...prev, name]));
    const property = props[name];
    if (property.type === PropertyType.CHECKBOX) {
      form.setValue(inputNameFor(prefixValue, name), true, {
        shouldValidate: true,
      });
    } else if (property.type === PropertyType.DATE_RANGE) {
      form.setValue(
        inputNameFor(prefixValue, name),
        { preset: 'last_7_days' },
        { shouldValidate: true },
      );
    }
  };

  const removeFilter = (name: string) => {
    setOrder((prev) => prev.filter((entry) => entry !== name));
    const property = props[name];
    form.setValue(inputNameFor(prefixValue, name), emptyValueFor(property), {
      shouldValidate: true,
    });
    if (property.type === PropertyType.CHECKBOX) {
      (property.reveals ?? []).forEach((revealName) => {
        if (props[revealName]) {
          form.setValue(
            inputNameFor(prefixValue, revealName),
            emptyValueFor(props[revealName]),
            { shouldValidate: true },
          );
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-input bg-background">
        {openNames.length === 0 ? (
          <EmptyFilterState />
        ) : (
          <div className="divide-y divide-border/70">
            {openNames.map((name) => (
              <FilterRow
                key={name}
                name={name}
                property={props[name]}
                props={props}
                disabled={disabled}
                renderField={renderField}
                onRemove={() => removeFilter(name)}
              />
            ))}
          </div>
        )}
        <div className="border-t border-border/70 px-3.5 py-3">
          <AddFilterPopover
            builderGroups={builderGroups}
            props={props}
            openSet={openSet}
            disabled={disabled}
            onAdd={addFilter}
            variant={openNames.length === 0 ? 'block' : 'inline'}
          />
        </div>
      </div>
      {footerGroup && (
        <FilterFooter
          group={footerGroup}
          props={props}
          prefixValue={prefixValue}
          disabled={disabled}
          activeCount={activeByValue.size}
        />
      )}
    </div>
  );
}

FilterBuilderLayout.displayName = 'FilterBuilderLayout';

function EmptyFilterState() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 pb-2.5 pt-[34px] text-center">
      <span className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Filter className="size-5" />
      </span>
      <span className="text-sm font-semibold text-foreground">
        {t('No filters added')}
      </span>
      <span className="max-w-xs text-sm text-muted-foreground">
        {t(
          'Without filters, this step returns the most recent results. Add a filter to narrow them.',
        )}
      </span>
    </div>
  );
}

function FilterRow({
  name,
  property,
  props,
  disabled,
  renderField,
  onRemove,
}: FilterRowProps) {
  const Icon = propertyIcons.get(iconNameFor(property));
  const label = 'displayName' in property ? property.displayName : name;
  const revealedInControl =
    property.type === PropertyType.CHECKBOX
      ? (property.reveals ?? []).filter((revealName) => !!props[revealName])
      : [];
  // A checkbox with no reveals already renders its description as the row's control,
  // so only surface the description below for the input-bearing filters.
  const controlRendersDescription =
    property.type === PropertyType.CHECKBOX && revealedInControl.length === 0;
  const description =
    'description' in property && property.description
      ? property.description
      : '';
  const showDescription = !!description && !controlRendersDescription;
  return (
    <div className="flex items-start gap-[11px] px-3.5 py-[13px]">
      <span className="flex h-[38px] w-[30px] shrink-0 items-center justify-center">
        <span className="flex size-[30px] items-center justify-center rounded-lg bg-primary/10 text-primary">
          {Icon ? <Icon className="size-4" /> : null}
        </span>
      </span>
      <span className="flex h-[38px] w-[104px] shrink-0 items-center text-sm font-semibold text-foreground">
        {t(label)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <FilterRowControl
          name={name}
          property={property}
          props={props}
          renderField={renderField}
        />
        {showDescription && (
          <span className="text-xs text-muted-foreground">
            {t(description)}
          </span>
        )}
      </div>
      <button
        type="button"
        aria-label={t('Remove filter')}
        disabled={disabled}
        onClick={onRemove}
        className="flex h-[38px] w-[30px] shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function FilterRowControl({
  name,
  property,
  props,
  renderField,
}: FilterRowControlProps) {
  if (property.type === PropertyType.CHECKBOX) {
    const reveals = (property.reveals ?? []).filter(
      (revealName) => !!props[revealName],
    );
    if (reveals.length > 0) {
      return (
        <div className="flex flex-col gap-2">
          {reveals.map((revealName) => (
            <React.Fragment key={revealName}>
              {renderField(revealName, {
                hideLabel: true,
                hideDescription: true,
              })}
            </React.Fragment>
          ))}
        </div>
      );
    }
    const description =
      'description' in property && property.description
        ? property.description
        : '';
    return (
      <span className="flex h-[38px] items-center text-sm text-muted-foreground">
        {description ? t(description) : null}
      </span>
    );
  }
  return <>{renderField(name, { hideLabel: true, hideDescription: true })}</>;
}

function AddFilterPopover({
  builderGroups,
  props,
  openSet,
  disabled,
  onAdd,
  variant,
}: AddFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'block' ? (
          <button
            type="button"
            disabled={disabled}
            className="flex w-full items-center justify-center gap-2 rounded-[11px] border-[1.5px] border-dashed border-primary/30 bg-primary/5 py-[13px] text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="size-4" />
            {t('Add filter')}
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            className="flex items-center gap-2 rounded-[9px] border border-input bg-background px-3.5 py-2 text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="size-4" />
            {t('Add filter')}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder={t('Filter by…')} />
          <CommandList>
            <CommandEmpty>{t('No filters found')}</CommandEmpty>
            {builderGroups.map((group) => {
              const items = group.props.filter((name) => !!props[name]);
              if (items.length === 0) {
                return null;
              }
              return (
                <CommandGroup
                  key={group.key}
                  heading={group.label ? t(group.label) : undefined}
                >
                  {items.map((name) => {
                    const property = props[name];
                    const Icon = propertyIcons.get(iconNameFor(property));
                    const label =
                      'displayName' in property ? property.displayName : name;
                    const added = openSet.has(name);
                    return (
                      <CommandItem
                        key={name}
                        value={label}
                        disabled={added}
                        onSelect={() => {
                          if (!added) {
                            onAdd(name);
                          }
                        }}
                      >
                        {Icon ? (
                          <Icon className="size-4 text-muted-foreground" />
                        ) : null}
                        <span className="flex-1">{t(label)}</span>
                        {added && (
                          <span className="flex items-center gap-1 text-xs font-medium text-primary">
                            <Check className="size-3.5" />
                            {t('Added')}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function FilterFooter({
  group,
  props,
  prefixValue,
  disabled,
  activeCount,
}: FilterFooterProps) {
  const form = useFormContext();
  const Icon = propertyIcons.get(group.icon);
  const memberNames = group.props.filter((name) => !!props[name]);
  const numberName = memberNames.find(
    (name) => props[name].type === PropertyType.NUMBER,
  );
  const numberProperty = numberName ? props[numberName] : undefined;
  const countRaw = numberName
    ? form.watch(inputNameFor(prefixValue, numberName))
    : undefined;
  const count = typeof countRaw === 'number' ? countRaw : Number(countRaw) || 0;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-input bg-background px-4 py-[13px]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {Icon ? <Icon className="size-4" /> : null}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">
            {numberName
              ? t('Returns up to {count} results', { count })
              : t(group.label ?? '')}
          </div>
          <div className="text-xs text-muted-foreground">
            {activeCount === 0
              ? t('No filters — newest first')
              : t(
                  '{count, plural, =1 {# filter applied} other {# filters applied}} · newest first',
                  { count: activeCount },
                )}
          </div>
        </div>
      </div>
      {numberName &&
        numberProperty &&
        numberProperty.type === PropertyType.NUMBER && (
          <FormField
            name={inputNameFor(prefixValue, numberName)}
            control={form.control}
            render={({ field }) => (
              <NumberStepper
                value={field.value}
                onChange={field.onChange}
                min={numberProperty.min}
                max={numberProperty.max}
                step={numberProperty.step}
                disabled={disabled}
              />
            )}
          />
        )}
    </div>
  );
}

function iconNameFor(property: PieceProperty): string | undefined {
  return 'icon' in property ? property.icon : undefined;
}

export { FilterBuilderLayout };

type RenderFieldFn = (
  propertyName: string,
  options?: { hideLabel?: boolean; hideDescription?: boolean },
) => React.ReactNode;

type FilterBuilderLayoutProps = {
  groups: PropertyGroup[];
  props: Record<string, PieceProperty>;
  prefixValue: string;
  disabled: boolean;
  renderField: RenderFieldFn;
};

type FilterRowProps = {
  name: string;
  property: PieceProperty;
  props: Record<string, PieceProperty>;
  disabled: boolean;
  renderField: RenderFieldFn;
  onRemove: () => void;
};

type FilterRowControlProps = {
  name: string;
  property: PieceProperty;
  props: Record<string, PieceProperty>;
  renderField: RenderFieldFn;
};

type AddFilterPopoverProps = {
  builderGroups: PropertyGroup[];
  props: Record<string, PieceProperty>;
  openSet: Set<string>;
  disabled: boolean;
  onAdd: (name: string) => void;
  variant: 'block' | 'inline';
};

type FilterFooterProps = {
  group: PropertyGroup;
  props: Record<string, PieceProperty>;
  prefixValue: string;
  disabled: boolean;
  activeCount: number;
};
