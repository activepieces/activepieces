import { t } from 'i18next';
import {
  Calendar,
  SquareFunction,
  File,
  Settings,
  Sparkles,
  Settings2,
  WandSparkles,
} from 'lucide-react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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
  ApEdition,
  FlowAction,
  FlowTrigger,
  PropertyExecutionType,
  ApFlagId,
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

function getInputMode(inputMode: PropertyExecutionType) {
  switch (inputMode) {
    case PropertyExecutionType.MANUAL:
      return t('Manual');
    case PropertyExecutionType.DYNAMIC:
      return t('Dynamic');
    case PropertyExecutionType.AUTO:
      return t('Auto');
    default:
      return t('Manual');
  }
}

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
  const { data: flags } = flagsHooks.useFlags();
  const inputMode =
    form.getValues().settings?.propertySettings?.[propertyName]?.type;
  const isManuallyMode = inputMode === PropertyExecutionType.MANUAL;
  const isDynamicMode = inputMode === PropertyExecutionType.DYNAMIC;
  const isAutoMode = inputMode === PropertyExecutionType.AUTO;
  const edition = flags?.[ApFlagId.EDITION];

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
              <Badge
                variant={
                  isAutoMode ? 'default' : isDynamicMode ? 'accent' : 'outline'
                }
                className="h-6 px-2 gap-1 cursor-pointer hover:opacity-80 transition-opacity"
              >
                {isManuallyMode && <Settings2 className="w-3 h-3" />}
                {allowDynamicValues && isDynamicMode && (
                  <SquareFunction className="w-3 h-3" />
                )}
                {isAutoMode && <WandSparkles className="w-3 h-3" />}
                {getInputMode(inputMode)}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{t('Input Mode')}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  handleDynamicValueToggleChange(PropertyExecutionType.MANUAL)
                }
              >
                <Settings className="w-4 h-4 mr-2" />
                <div>
                  <div className="font-medium">{t('Manually')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('Enter the value for this field manually')}
                  </div>
                </div>
              </DropdownMenuItem>
              {allowDynamicValues && (
                <DropdownMenuItem
                  onClick={() =>
                    handleDynamicValueToggleChange(
                      PropertyExecutionType.DYNAMIC,
                    )
                  }
                >
                  <SquareFunction className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">{t('Dynamic')}</div>
                    <div className="text-xs text-muted-foreground">
                      {t(
                        'Enter the value dynamically from your previous steps',
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
              {edition !== ApEdition.COMMUNITY && (
                <DropdownMenuItem
                  onClick={() =>
                    handleDynamicValueToggleChange(PropertyExecutionType.AUTO)
                  }
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">{t('Auto')}</div>
                    <div className="text-xs text-muted-foreground">
                      {t(
                        'AI will fill in the field using the context from previous steps and the flow prompt',
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
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

      {!placeBeforeLabelText && isManuallyMode && <div>{children}</div>}
      {property.description && !hideDescription && (
        <ReadMoreDescription text={t(property.description)} />
      )}
    </FormItem>
  );
};

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };
