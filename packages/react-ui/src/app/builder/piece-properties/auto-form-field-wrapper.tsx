import { t } from 'i18next';
import { Calendar, SquareFunction, File, MoreHorizontal, Settings, Sparkles } from 'lucide-react';
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
import { FlowAction, FlowTrigger } from '@activepieces/shared';

import { ArrayPiecePropertyInInlineItemMode } from './array-property-in-inline-item-mode';
import { TextInputWithMentions } from './text-input-with-mentions';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

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
  const inputMode = form.getValues().settings?.inputUiInfo?.customizedInputs?.[propertyName] || 'Manually';
  const isManuallyMode = inputMode === 'Manually';
  const isDynamicMode = inputMode === 'Dynamic';
  const isAutoMode = inputMode === 'Auto';

  function handleInputModeChange(mode: 'Manually' | 'Dynamic' | 'Auto') {
    const newCustomizedInputs = {
      ...form.getValues().settings?.inputUiInfo?.customizedInputs,
      [propertyName]: mode,
    };
    form.setValue(
      `settings.inputUiInfo.customizedInputs`,
      newCustomizedInputs,
      {
        shouldValidate: true,
      },
    );
    if (isInputNameLiteral(inputName)) {
      form.setValue(inputName, null, {
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
        <div className="flex gap-2 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-3">
                <span>
                  {isManuallyMode && <Settings className="w-4 h-4" />}
                  {allowDynamicValues && isDynamicMode && <SquareFunction className="w-4 h-4" />}
                  {isAutoMode && <Sparkles className="w-4 h-4" />}
                </span>
                {inputMode}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{t('Input Mode')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleInputModeChange('Manually')}>
                <Settings className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">{t('Manually')}</div>
                  <div className="text-xs text-muted-foreground">{t('Enter the value for this field manually')}</div>
                </div>
              </DropdownMenuItem>
              {allowDynamicValues && (
                <DropdownMenuItem onClick={() => handleInputModeChange('Dynamic')}>
                  <SquareFunction className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">{t('Dynamic')}</div>
                    <div className="text-xs text-muted-foreground">{t('Use dynamic values from previous steps')}</div>
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleInputModeChange('Auto')}>
                <Sparkles className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">{t('Auto')}</div>
                  <div className="text-xs text-muted-foreground">{t('AI will fill out the field using the context of the previous steps')}</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

      {!placeBeforeLabelText && isManuallyMode && (
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
