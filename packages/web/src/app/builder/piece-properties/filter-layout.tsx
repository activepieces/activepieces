import {
  PieceProperty,
  PropertyGroup,
  PropertyType,
} from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { Search, X } from 'lucide-react';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { filterPropertyUtils } from './filter-property-utils';
import { propertyIcons } from './property-icons';

const {
  inputNameFor,
  collectRevealedNames,
  isFilterActive,
  emptyValueFor,
  chipLabel,
} = filterPropertyUtils;

function FilterPropertiesLayout({
  groups,
  props,
  prefixValue,
  disabled,
  renderField,
}: FilterPropertiesLayoutProps) {
  const sectionGroups = groups.filter((group) => group.display === 'section');
  const sectionPropNames = sectionGroups.flatMap((group) =>
    group.props.filter((name) => !!props[name]),
  );
  const revealed = collectRevealedNames(props);
  const groupedNames = new Set([...sectionPropNames, ...revealed]);
  const ungroupedNames = Object.keys(props).filter(
    (name) => !groupedNames.has(name),
  );

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        if (group.display === 'summary') {
          return (
            <FilterSummary
              key={group.key}
              filterPropNames={sectionPropNames}
              props={props}
              prefixValue={prefixValue}
              disabled={disabled}
            />
          );
        }
        if (group.display === 'section') {
          return (
            <PropertySection
              key={group.key}
              group={group}
              props={props}
              prefixValue={prefixValue}
              disabled={disabled}
              renderField={renderField}
            />
          );
        }
        return null;
      })}
      {ungroupedNames.map((name) => (
        <React.Fragment key={name}>{renderField(name)}</React.Fragment>
      ))}
    </div>
  );
}

FilterPropertiesLayout.displayName = 'FilterPropertiesLayout';

function PropertySection({
  group,
  props,
  prefixValue,
  disabled,
  renderField,
}: PropertySectionProps) {
  const Icon = propertyIcons.get(group.icon);
  const memberNames = group.props.filter((name) => !!props[name]);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-6 bg-gray-1 p-4">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent-3 text-accent-11">
            <Icon className="size-4" />
          </span>
        )}
        <span className="text-sm font-semibold tracking-[-0.005em] text-gray-12">
          {group.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {memberNames.map((name) => {
          const property = props[name];
          if (
            property.type === PropertyType.CHECKBOX &&
            (property.reveals?.length ?? 0) > 0
          ) {
            return (
              <div key={name} className="col-span-2 min-w-0">
                <ToggleRevealCard
                  checkboxName={name}
                  revealNames={property.reveals ?? []}
                  props={props}
                  prefixValue={prefixValue}
                  disabled={disabled}
                  renderField={renderField}
                />
              </div>
            );
          }
          const isHalf = 'width' in property && property.width === 'half';
          return (
            <div
              key={name}
              className={cn('min-w-0', isHalf ? 'col-span-1' : 'col-span-2')}
            >
              {renderField(name)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRevealCard({
  checkboxName,
  revealNames,
  props,
  prefixValue,
  disabled,
  renderField,
}: ToggleRevealCardProps) {
  const form = useFormContext();
  const checkbox = props[checkboxName];
  const checkboxInputName = inputNameFor(prefixValue, checkboxName);
  const checked = form.watch(checkboxInputName) === true;
  const reveals = revealNames.filter((name) => !!props[name]);
  const title = 'displayName' in checkbox ? checkbox.displayName : '';
  const description =
    'description' in checkbox ? checkbox.description : undefined;

  return (
    <div className="rounded-lg border border-gray-6 bg-gray-3/30 px-3.5 py-3">
      <FormField
        name={checkboxInputName}
        control={form.control}
        render={({ field }) => (
          <label className="flex cursor-pointer items-center gap-3">
            <Switch
              checked={field.value === true}
              disabled={disabled}
              onCheckedChange={(next) => {
                field.onChange(next);
                if (!next) {
                  reveals.forEach((name) =>
                    form.setValue(
                      inputNameFor(prefixValue, name),
                      emptyValueFor(props[name]),
                      { shouldValidate: true },
                    ),
                  );
                }
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-12">
                {t(title)}
              </div>
              {description && (
                <div className="text-xs text-gray-11">{t(description)}</div>
              )}
            </div>
          </label>
        )}
      />
      {checked && reveals.length > 0 && (
        <div className="mt-3 flex flex-col gap-3 border-t border-dashed border-gray-6 pt-3">
          {reveals.map((name) => (
            <React.Fragment key={name}>{renderField(name)}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSummary({
  filterPropNames,
  props,
  prefixValue,
  disabled,
}: FilterSummaryProps) {
  const form = useFormContext();
  const watched = form.watch(
    filterPropNames.map((name) => inputNameFor(prefixValue, name)),
  );
  const active = filterPropNames
    .map((name, index) => ({
      name,
      property: props[name],
      value: watched[index],
    }))
    .filter(({ property, value }) => isFilterActive(property, value));

  const clearOne = (name: string, property: PieceProperty) => {
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
    <div className="flex flex-col gap-2 rounded-lg border border-gray-6 bg-gray-3/30 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-12">
          <Search className="size-4 text-accent-11" />
          {t('Active filters')}
        </span>
        {active.length > 0 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              active.forEach(({ name, property }) => clearOne(name, property))
            }
            className="text-xs text-gray-11 outline-none transition-colors hover:text-gray-12 focus-visible:text-gray-12 disabled:pointer-events-none disabled:opacity-50"
          >
            {t('Clear all')}
          </button>
        )}
      </div>
      {active.length === 0 ? (
        <span className="text-sm text-gray-11">{t('No filters yet')}</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {active.map(({ name, property, value }) => (
            <span
              key={name}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-accent-3 py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-accent-11"
            >
              <span className="truncate">{chipLabel(property, value)}</span>
              <button
                type="button"
                aria-label={t('Remove')}
                disabled={disabled}
                onClick={() => clearOne(name, property)}
                className="shrink-0 rounded-full p-0.5 text-accent-11/70 outline-none transition-colors hover:text-accent-11 focus-visible:ring-2 focus-visible:ring-accent-8/50 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export { FilterPropertiesLayout };

type FilterPropertiesLayoutProps = {
  groups: PropertyGroup[];
  props: Record<string, PieceProperty>;
  prefixValue: string;
  disabled: boolean;
  renderField: (propertyName: string) => React.ReactNode;
};

type PropertySectionProps = {
  group: PropertyGroup;
  props: Record<string, PieceProperty>;
  prefixValue: string;
  disabled: boolean;
  renderField: (propertyName: string) => React.ReactNode;
};

type ToggleRevealCardProps = {
  checkboxName: string;
  revealNames: string[];
  props: Record<string, PieceProperty>;
  prefixValue: string;
  disabled: boolean;
  renderField: (propertyName: string) => React.ReactNode;
};

type FilterSummaryProps = {
  filterPropNames: string[];
  props: Record<string, PieceProperty>;
  prefixValue: string;
  disabled: boolean;
};
