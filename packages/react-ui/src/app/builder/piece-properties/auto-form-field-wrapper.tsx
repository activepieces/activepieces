import { t } from 'i18next';
import { Calendar, SquareFunction, File } from 'lucide-react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { FormItem, FormLabel } from '@/components/ui/form';
import { ReadMoreDescription } from '@/components/ui/read-more-description';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
};

const getDefaultValueForDynamicValue = (
  property: PieceProperty,
  currentValue: unknown,
) => {
  if (property.type === PropertyType.ARRAY) {
    return null;
  }
  return typeof currentValue === 'string' || typeof currentValue === 'number'
    ? currentValue
    : JSON.stringify(currentValue);
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
}: AutoFormFieldWrapperProps) => {
  const form = useFormContext<FlowAction | FlowTrigger>();
  const dynamicInputModeToggled =
    form.getValues().settings?.propertySettings?.[propertyName]?.type ===
    PropertyExecutionType.DYNAMIC;
  function handleDynamicValueToggleChange(mode: PropertyExecutionType) {
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
          : property.defaultValue ?? null;
      form.setValue(inputName, newValue, {
        shouldValidate: true,
      });
    } else {
      throw new Error(
        'inputName is not a member of step settings input, you might be using dynamic properties where you should not',
      );
    }
  }
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
                {property.type === PropertyType.FILE && t('File Input')}
                {property.type === PropertyType.DATE_TIME && t('Date Input')}
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
          <div className="flex gap-2 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={dynamicInputModeToggled}
                  onPressedChange={(e) =>
                    handleDynamicValueToggleChange(
                      e
                        ? PropertyExecutionType.DYNAMIC
                        : PropertyExecutionType.MANUAL,
                    )
                  }
                  disabled={disabled}
                >
                  <SquareFunction
                    className={cn('size-5', {
                      'text-foreground': dynamicInputModeToggled,
                      'text-muted-foreground': !dynamicInputModeToggled,
                    })}
                  />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-background">
                {t('Dynamic value')}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </FormLabel>

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
      {property.description && !hideDescription && (
        <ReadMoreDescription text={t(property.description)} />
      )}
    </FormItem>
  );
};

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };
