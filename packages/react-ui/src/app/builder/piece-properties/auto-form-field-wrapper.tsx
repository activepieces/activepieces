import { t } from 'i18next';
import {
  Calendar,
  SquareFunction,
  File,
  Sparkles,
} from 'lucide-react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { FormItem, FormLabel } from '@/components/ui/form';
import { ReadMoreDescription } from '@/components/ui/read-more-description';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';
import {
  PropertyExecutionType,
  ApFlagId,
} from '@activepieces/shared';

import { ArrayPiecePropertyInInlineItemMode } from './array-property-in-inline-item-mode';
import { TextInputWithMentions } from './text-input-with-mentions';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { propertyUtils } from './property-utils';


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
  const form = useFormContext();
  const { data: flags } = flagsHooks.useFlags();
  const inputMode =
    form.getValues().settings?.propertySettings?.[propertyName]?.type;
  const isManuallyMode = inputMode === PropertyExecutionType.MANUAL;
  const isDynamicMode = inputMode === PropertyExecutionType.DYNAMIC;
  const isAutoMode = inputMode === PropertyExecutionType.AUTO;
  const edition = flags?.[ApFlagId.EDITION];

  const isArrayProperty = property.type === PropertyType.ARRAY;

  return (
    <FormItem className="flex flex-col gap-1">
      <FormLabel className="flex items-center gap-1 " skipError={isAutoMode}>
        {placeBeforeLabelText && isManuallyMode && children}
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
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={isDynamicMode}
                  onPressedChange={(e) => {
                    const newMode = e
                      ? PropertyExecutionType.DYNAMIC
                      : PropertyExecutionType.MANUAL;
                    propertyUtils.handleDynamicValueToggleChange(
                      form,
                      newMode,
                      propertyName,
                      inputName,
                    );
                  }}
                  disabled={disabled}
                  className='p-2'
                >
                  <SquareFunction
                    className={cn('size-5', {
                      'text-foreground': isDynamicMode,
                      'text-muted-foreground': !isDynamicMode,
                    })}
                  />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-background">
                {t('Dynamic value')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={isAutoMode}
                  onPressedChange={(e) => {
                    const newMode = e
                      ? PropertyExecutionType.AUTO
                      : isDynamicMode
                      ? PropertyExecutionType.DYNAMIC
                      : PropertyExecutionType.MANUAL;
                    propertyUtils.handleDynamicValueToggleChange(
                      form,
                      newMode,
                      propertyName,
                      inputName,
                    );
                  }}
                  disabled={disabled}
                  className='p-2'
                >
                  <Sparkles
                    className={cn('size-5', {
                      'text-primary': isAutoMode,
                      'text-muted-foreground': !isAutoMode,
                    })}
                  />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-background">
                {t('Auto filled by AI')}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

      </FormLabel>

      {isDynamicMode && !isArrayProperty && (
        <TextInputWithMentions
          disabled={disabled}
          onChange={field.onChange}
          initialValue={field.value ?? property.defaultValue ?? null}
        />
      )}

      {isArrayProperty && isDynamicMode && (
        <ArrayPiecePropertyInInlineItemMode
          disabled={disabled}
          arrayProperties={property.properties}
          inputName={inputName}
          onChange={field.onChange}
          value={field.value ?? property.defaultValue ?? null}
        />
      )}

      {!placeBeforeLabelText && isManuallyMode && <div>{children}</div>}
      {property.description && !hideDescription && (
        <ReadMoreDescription text={t(property.description)} />
      )}
    </FormItem>
  );
};

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };
