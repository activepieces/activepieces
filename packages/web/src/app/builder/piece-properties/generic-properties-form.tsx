import { isNil } from '@activepieces/core-utils';
import {
  OAuth2Props,
  PiecePropertyMap,
  ArraySubProps,
  PropertyGroup,
  PieceProperty,
} from '@activepieces/pieces-framework';
import { PropertyExecutionType, PropertySettings } from '@activepieces/shared';
import React from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField } from '@/components/ui/form';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';

import { FilterBuilderLayout } from './filter-builder-layout';
import { FilterPropertiesLayout } from './filter-layout';
import {
  selectGenericFormComponentForProperty,
  SelectGenericFormComponentForPropertyParams,
} from './properties-utils';
import { PropertyGroupTabs } from './property-group-tabs';

export const GenericPropertiesForm = React.memo(
  ({
    markdownVariables,
    props,
    propertySettings,
    prefixValue,
    disabled,
    useMentionTextInput,
    onValueChange,
    dynamicPropsInfo,
    propertyGroups,
  }: GenericPropertiesFormProps) => {
    const form = useFormContext();
    const groupByPropName = buildGroupByPropName(propertyGroups);
    const renderedGroups = new Set<string>();

    const inputNameFor = (propertyName: string) =>
      prefixValue.length > 0 ? `${prefixValue}.${propertyName}` : propertyName;

    const renderField = (
      propertyName: string,
      options?: { hideLabel?: boolean; hideDescription?: boolean },
    ) => {
      const dynamicInputModeToggled =
        propertySettings?.[propertyName]?.type ===
        PropertyExecutionType.DYNAMIC;
      return (
        <FormField
          key={propertyName}
          name={inputNameFor(propertyName)}
          control={form.control}
          render={({ field }) =>
            selectGenericFormComponentForProperty({
              field: {
                ...field,
                onChange: (value) => {
                  field.onChange(value);
                  onValueChange?.({ value, propertyName });
                },
              },
              propertyName,
              inputName: inputNameFor(propertyName),
              property: props[propertyName],
              allowDynamicValues:
                !isNil(propertySettings) && !options?.hideLabel,
              markdownVariables: markdownVariables ?? {},
              useMentionTextInput: useMentionTextInput,
              disabled: disabled ?? false,
              dynamicInputModeToggled,
              form,
              dynamicPropsInfo,
              propertySettings,
              hideLabel: options?.hideLabel,
              hideDescription: options?.hideDescription,
            })
          }
        />
      );
    };

    if (Object.keys(props).length === 0) {
      return null;
    }

    const isBuilder = (propertyGroups ?? []).some(
      (group) => group.display === 'builder' || group.display === 'footer',
    );

    if (isBuilder) {
      return (
        <FilterBuilderLayout
          groups={propertyGroups ?? []}
          props={props}
          prefixValue={prefixValue}
          disabled={disabled ?? false}
          renderField={renderField}
        />
      );
    }

    const isSectioned = (propertyGroups ?? []).some(
      (group) => group.display === 'section' || group.display === 'summary',
    );

    if (isSectioned) {
      return (
        <FilterPropertiesLayout
          groups={propertyGroups ?? []}
          props={props}
          prefixValue={prefixValue}
          disabled={disabled ?? false}
          renderField={renderField}
        />
      );
    }

    return (
      <div className={cn('flex flex-col', GAP_SIZE_FOR_STEP_SETTINGS)}>
        {Object.entries(props).map(([propertyName]) => {
          const group = groupByPropName.get(propertyName);
          if (group) {
            if (renderedGroups.has(group.key)) {
              return null;
            }
            renderedGroups.add(group.key);
            const groupProperties = group.props.reduce<
              Record<string, PieceProperty>
            >((acc, key) => {
              if (props[key]) {
                acc[key] = props[key];
              }
              return acc;
            }, {});
            return (
              <PropertyGroupTabs
                key={group.key}
                group={group}
                properties={groupProperties}
                prefixValue={prefixValue}
                propertySettings={propertySettings}
                disabled={disabled ?? false}
              />
            );
          }
          return renderField(propertyName);
        })}
      </div>
    );
  },
);

GenericPropertiesForm.displayName = 'GenericFormComponent';

function buildGroupByPropName(
  propertyGroups: PropertyGroup[] | undefined,
): Map<string, PropertyGroup> {
  const map = new Map<string, PropertyGroup>();
  (propertyGroups ?? [])
    .filter((group) => group.display === 'tabs')
    .forEach((group) => {
      group.props.forEach((propName) => map.set(propName, group));
    });
  return map;
}

type GenericPropertiesFormProps = {
  props: PiecePropertyMap | OAuth2Props | ArraySubProps<boolean>;
  /**Use this to allow user toggling property execution type */
  propertySettings: Record<string, PropertySettings> | null;
  prefixValue: string;
  markdownVariables?: Record<string, string>;
  useMentionTextInput: boolean;
  disabled?: boolean;
  onValueChange?: (val: { value: unknown; propertyName: string }) => void;
  /**for dynamic dropdowns and dynamic properties */
  dynamicPropsInfo: SelectGenericFormComponentForPropertyParams['dynamicPropsInfo'];
  /**groups multiple props into a single widget (e.g. tabbed recipients) */
  propertyGroups?: PropertyGroup[];
};
