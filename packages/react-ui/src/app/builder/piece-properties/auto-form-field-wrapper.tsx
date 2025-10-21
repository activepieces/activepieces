import { t } from 'i18next';
import { Calendar, SquareFunction, File } from 'lucide-react';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormItem, FormLabel } from '@/components/ui/form';
import { ReadMoreDescription } from '@/components/ui/read-more-description';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { getDefaultPropertyValue } from '@/features/pieces/lib/form-utils';
import { cn } from '@/lib/utils';
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';
import {
  FlowAction,
  FlowTrigger,
  PropertyExecutionType,
} from '@activepieces/shared';

import { ArrayPiecePropertyInInlineItemMode } from './array-property-in-inline-item-mode';
import { TextInputWithMentions } from './text-input-with-mentions';

type inputNameLiteral = `settings.input.${string}`;

const isInputNameLiteral = (
  inputName: string,
): inputName is inputNameLiteral => {
  return inputName.match(/settings\.input\./) !== null;
};

type AutoFormFieldWrapperProps = {
  children: React.ReactNode;
  allowDynamicValues: boolean;
  propertyName: string;
  property: PieceProperty;
  hideDescription?: boolean;
  placeBeforeLabelText?: boolean;
  disabled: boolean;
  field: ControllerRenderProps;
  inputName: string;
  dynamicInputModeToggled?: boolean;
};

const getDefaultValueForDynamicValue = (
  property: PieceProperty,
  currentValue: unknown,
) => {
  if (property.type === PropertyType.ARRAY) {
    return getDefaultPropertyValue({ property, dynamicInputModeToggled: true });
  }

  return typeof currentValue === 'string' || typeof currentValue === 'number'
    ? currentValue
    : JSON.stringify(currentValue);
};

const DynamicValueToggle = ({
  propertyName,
  inputName,
  property,
  disabled,
  isToggled,
}: {
  propertyName: string;
  inputName: string;
  property: PieceProperty;
  disabled: boolean;
  isToggled: boolean;
}) => {
  const form = useFormContext<FlowAction | FlowTrigger>();
  const handleDynamicValueToggleChange = (mode: PropertyExecutionType) => {
    const propertySettingsForSingleProperty = {
      ...form.getValues().settings?.propertySettings?.[propertyName],
      type: mode,
    };
    form.setValue(
      `settings.propertySettings.${propertyName}`,
      propertySettingsForSingleProperty,
      {
        shouldValidate: true,
      },
    );
    if (isInputNameLiteral(inputName)) {
      const currentValue = form.getValues(inputName);
      const newValue =
        mode === PropertyExecutionType.DYNAMIC
          ? getDefaultValueForDynamicValue(property, currentValue)
          : getDefaultPropertyValue({
              property,
              dynamicInputModeToggled: false,
            });
      form.setValue(inputName, newValue, {
        shouldValidate: true,
      });
    } else {
      throw new Error(
        'inputName is not a member of step settings input, you might be using dynamic properties where you should not',
      );
    }
  };
  return (
    <div className="flex gap-2 items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={isToggled}
            onPressedChange={(newIsToggled) =>
              handleDynamicValueToggleChange(
                newIsToggled
                  ? PropertyExecutionType.DYNAMIC
                  : PropertyExecutionType.MANUAL,
              )
            }
            disabled={disabled}
          >
            <SquareFunction
              className={cn('size-5', {
                'text-foreground': isToggled,
                'text-muted-foreground': !isToggled,
              })}
            />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-background">
          {t('Dynamic value')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

const AutoFormFieldWrapper = ({
  placeBeforeLabelText = false,
  children,
  hideDescription,
  allowDynamicValues,
  propertyName,
  inputName,
  property,
  disabled,
  field,
  dynamicInputModeToggled,
}: AutoFormFieldWrapperProps) => {
  const isArrayProperty = property.type === PropertyType.ARRAY;
  return (
    <FormItem className="flex flex-col gap-1">
      <FormLabel className="flex items-center gap-1 ">
        {placeBeforeLabelText && !dynamicInputModeToggled && children}
        {(property.type === PropertyType.FILE ||
          property.type === PropertyType.DATE_TIME) && (
          <Tooltip>
            <TooltipTrigger asChild>
              {property.type === PropertyType.FILE ? (
                <File className="w-4 h-4 stroke-foreground/55"></File>
              ) : (
                property.type === PropertyType.DATE_TIME && (
                  <Calendar className="w-4 h-4 stroke-foreground/55"></Calendar>
                )
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <>
                {property.type === PropertyType.FILE &&
                  t('File Input i.e a url or file passed from a previous step')}
                {property.type === PropertyType.DATE_TIME &&
                  t('Date Input must comply with ISO 8601 format')}
              </>
            </TooltipContent>
          </Tooltip>
        )}
        <div className="pt-1">
          <span>{t(property.displayName)}</span>{' '}
          {property.required && <span className="text-destructive">*</span>}
        </div>

        <span className="grow"></span>
        {allowDynamicValues && (
          <DynamicValueToggle
            propertyName={propertyName}
            inputName={inputName}
            property={property}
            disabled={disabled}
            isToggled={dynamicInputModeToggled ?? false}
          />
        )}
      </FormLabel>
      <AutoFormFielWrapperErrorBoundary
        field={field}
        property={property}
        dynamicInputModeToggled={dynamicInputModeToggled}
      >
        {dynamicInputModeToggled && !isArrayProperty && (
          <TextInputWithMentions
            disabled={disabled}
            onChange={field.onChange}
            initialValue={field.value ?? property.defaultValue ?? null}
          />
        )}

        {isArrayProperty && dynamicInputModeToggled && (
          <ArrayPiecePropertyInInlineItemMode
            disabled={disabled}
            arrayProperties={property.properties}
            inputName={inputName}
            onChange={field.onChange}
            value={field.value ?? property.defaultValue ?? null}
          />
        )}

        {!placeBeforeLabelText && !dynamicInputModeToggled && (
          <div>{children}</div>
        )}
      </AutoFormFielWrapperErrorBoundary>

      {property.description && !hideDescription && (
        <ReadMoreDescription text={t(property.description)} />
      )}
    </FormItem>
  );
};

const AutoFormFielWrapperErrorBoundary = ({
  children,
  field,
  property,
  dynamicInputModeToggled,
}: {
  children: React.ReactNode;
  field: ControllerRenderProps;
  property: PieceProperty;
  dynamicInputModeToggled?: boolean;
}) => {
  return (
    <ErrorBoundary
      fallbackRender={() => (
        <div className="text-sm  flex items-center justify-between">
          <div className="text-red-500">
            {t('input value is invalid, please contact support')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(
                JSON.stringify({
                  stringifiedValue: stringifyValue(field.value),
                  property,
                  dynamicInputModeToggled,
                  disabled: field.disabled,
                }),
              );
              toast({
                title: t('Info copied to clipboard, please send it to support'),
                duration: 5000,
              });
            }}
          >
            {t('Info')}
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

const stringifyValue = (value: unknown) => {
  try {
    if (value === undefined) {
      return 'undefined';
    }
    return JSON.stringify(value);
  } catch (e) {
    return value;
  }
};

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };
