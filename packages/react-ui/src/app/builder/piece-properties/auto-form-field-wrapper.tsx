import { t } from 'i18next';
import { Calendar, SquareFunction, File } from 'lucide-react';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { FormItem, FormLabel } from '@/components/ui/form';
import { ReadMoreDescription } from '@/components/ui/read-more-description';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formUtils } from '@/features/pieces/lib/form-utils';
import { cn } from '@/lib/utils';
import {
  PieceAuthProperty,
  PieceProperty,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  FlowAction,
  FlowTrigger,
  PropertyExecutionType,
} from '@activepieces/shared';

import { ArrayPiecePropertyInInlineItemMode } from './array-property-in-inline-item-mode';
import { TextInputWithMentions } from './text-input-with-mentions';

function AutoFormFieldWrapper({
  placeBeforeLabelText = false,
  hideLabel,
  children,
  allowDynamicValues,
  propertyName,
  inputName,
  property,
  disabled,
  field,
  dynamicInputModeToggled,
  //we have to pass this prop, because props inside custom auth can be secret text, which means their labels will become (Connection)
  isForConnectionSelect = false,
}: AutoFormFieldWrapperProps) {
  const isArrayProperty =
    !isPieceAuthProperty(property) && property.type === PropertyType.ARRAY;
  const isAuthProperty = isForConnectionSelect || Array.isArray(property);
  return (
    <AutoFormFielWrapperErrorBoundary
      field={field}
      property={property ?? null}
      dynamicInputModeToggled={dynamicInputModeToggled}
    >
      <FormItem className="flex flex-col gap-1">
        {!hideLabel && (
          <FormLabel className="flex items-center gap-1 ">
            {placeBeforeLabelText && !dynamicInputModeToggled && children}
            <div className="pt-1">
              <span>
                {isAuthProperty ? t('Connection') : property.displayName}
              </span>{' '}
              {(isAuthProperty || property.required) && (
                <span className="text-destructive">*</span>
              )}
            </div>
            {property && !isAuthProperty && (
              <PropertyTypeTooltip property={property} />
            )}
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
        )}
        {dynamicInputModeToggled && !isArrayProperty && (
          <TextInputWithMentions
            disabled={disabled}
            onChange={field.onChange}
            initialValue={field.value ?? null}
          />
        )}

        {isArrayProperty && dynamicInputModeToggled && (
          <ArrayPiecePropertyInInlineItemMode
            disabled={disabled}
            arrayProperties={property.properties}
            inputName={inputName}
            onChange={field.onChange}
            value={field.value ?? null}
          />
        )}

        {!placeBeforeLabelText && !dynamicInputModeToggled && (
          <div>{children}</div>
        )}

        {!isForConnectionSelect &&
          !Array.isArray(property) &&
          property.description && (
            <ReadMoreDescription text={t(property.description)} />
          )}
      </FormItem>
    </AutoFormFielWrapperErrorBoundary>
  );
}

function AutoFormFielWrapperErrorBoundary({
  children,
  field,
  property,
  dynamicInputModeToggled,
}: AutoFormFielWrapperErrorBoundaryProps) {
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
              toast(t('Info copied to clipboard, please send it to support'), {
                duration: 3000,
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
}

function getValueForInputOnDynamicToggleChange(
  property: PieceProperty | PieceAuthProperty[],
  newMode: PropertyExecutionType,
  currentValue: unknown,
) {
  const isAuthProperty = isPieceAuthProperty(property);
  switch (newMode) {
    case PropertyExecutionType.DYNAMIC: {
      if (!isAuthProperty && property.type === PropertyType.ARRAY) {
        return formUtils.getDefaultPropertyValue({
          property,
          dynamicInputModeToggled: true,
        });
      }
      //to show what the selected value is for dropdowns
      if (
        typeof currentValue === 'string' ||
        typeof currentValue === 'number'
      ) {
        return currentValue;
      }
      return JSON.stringify(currentValue);
    }
    case PropertyExecutionType.MANUAL:
      if (isAuthProperty) {
        return '';
      }
      return formUtils.getDefaultPropertyValue({
        property,
        dynamicInputModeToggled: false,
      });
  }
}

function DynamicValueToggle({
  propertyName,
  inputName,
  property,
  disabled,
  isToggled,
}: DynamicValueToggleProps) {
  const form = useFormContext<FlowAction | FlowTrigger>();
  function updatePropertySettings(mode: PropertyExecutionType) {
    const propertySettingsForSingleProperty = {
      ...form.getValues().settings?.propertySettings?.[propertyName],
      type: mode,
    };
    form.setValue(
      `settings.propertySettings.${propertyName}`,
      propertySettingsForSingleProperty,
    );
  }
  function handleDynamicValueToggleChange(mode: PropertyExecutionType) {
    updatePropertySettings(mode);
    if (isInputNameLiteral(inputName)) {
      const currentValue = form.getValues(inputName);
      const newValue = getValueForInputOnDynamicToggleChange(
        property,
        mode,
        currentValue,
      );
      form.setValue(inputName, newValue, {
        shouldValidate: true,
      });
    } else {
      throw new Error(
        'inputName is not a member of step settings input, you might be using dynamic properties where you should not',
      );
    }
  }
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
        <TooltipContent side="top">{t('Dynamic value')}</TooltipContent>
      </Tooltip>
    </div>
  );
}
function PropertyTypeTooltip({ property }: { property: PieceProperty }) {
  if (
    property.type !== PropertyType.FILE &&
    property.type !== PropertyType.DATE_TIME
  ) {
    return null;
  }

  return (
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
  );
}
function stringifyValue(value: unknown) {
  try {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    return JSON.stringify(value);
  } catch (e) {
    return value;
  }
}

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };

type DynamicValueToggleProps = {
  propertyName: string;
  inputName: string;
  property: PieceProperty | PieceAuthProperty[];
  disabled: boolean;
  isToggled: boolean;
};

type AutoFormFieldWrapperProps = {
  children: React.ReactNode;
  hideLabel?: boolean;
  allowDynamicValues: boolean;
  propertyName: string;
  hideDescription?: boolean;
  placeBeforeLabelText?: boolean;
  disabled: boolean;
  field: ControllerRenderProps<any, string>;
  inputName: string;
  dynamicInputModeToggled?: boolean;
  property: PieceProperty | PieceAuthProperty[];
  isForConnectionSelect?: boolean;
};
type AutoFormFielWrapperErrorBoundaryProps = {
  children: React.ReactNode;
  field: ControllerRenderProps;
  property: PieceProperty | PieceAuthProperty[] | null;
  dynamicInputModeToggled?: boolean;
};
function isInputNameLiteral(
  inputName: string,
): inputName is `settings.input.${string}` {
  return inputName.match(/settings\.input\./) !== null;
}
function isPieceAuthProperty(
  property: PieceProperty | PieceAuthProperty[],
): property is PieceAuthProperty[] {
  const authPropertyTypes = [
    PropertyType.SECRET_TEXT,
    PropertyType.BASIC_AUTH,
    PropertyType.OAUTH2,
    PropertyType.CUSTOM_AUTH,
  ];
  return (
    Array.isArray(property) ||
    authPropertyTypes.some((authType) => property.type === authType)
  );
}
