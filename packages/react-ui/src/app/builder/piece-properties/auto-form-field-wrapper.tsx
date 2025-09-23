import { t } from 'i18next';
import {
  Calendar,
  File,
} from 'lucide-react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';

import { FormItem, FormLabel } from '@/components/ui/form';
import { ReadMoreDescription } from '@/components/ui/read-more-description';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';
import {
  PropertyExecutionType,
} from '@activepieces/shared';

import { ArrayPiecePropertyInInlineItemMode } from './array-property-in-inline-item-mode';
import { TextInputWithMentions } from './text-input-with-mentions';
import { AutoDynamicFields } from './auto-dynamic-fields';
import { FlowAction, FlowTrigger } from '@activepieces/shared';


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

const hideAutoDynamicFields = (property: PieceProperty) => {
  const hiddenTypes = [PropertyType.DYNAMIC, PropertyType.DROPDOWN, PropertyType.STATIC_DROPDOWN, PropertyType.MULTI_SELECT_DROPDOWN, PropertyType.STATIC_MULTI_SELECT_DROPDOWN, PropertyType.MARKDOWN];
  return hiddenTypes.includes(property.type);
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
  const inputMode =
    form.getValues().settings?.propertySettings?.[propertyName]?.type;
  const isManuallyMode = inputMode === PropertyExecutionType.MANUAL || inputMode === undefined;
  const isDynamicMode = inputMode === PropertyExecutionType.DYNAMIC;
  const isAutoMode = inputMode === PropertyExecutionType.AUTO;
  const isAuthProperty = property.type === PropertyType.OAUTH2 || property.type === PropertyType.CUSTOM_AUTH || property.type === PropertyType.BASIC_AUTH;

  const isArrayProperty = property.type === PropertyType.ARRAY;

  return (
    <FormItem className="flex flex-col">
      <FormLabel className="flex items-center gap-1 text-sm" skipError={isAutoMode}>
        {!isAuthProperty && (
          <div className="pt-1">
            <span>{t(property.displayName)}</span>{' '}
            {property.required && <span className="text-destructive">*</span>}
          </div>
        )}

        <span className="grow"></span>

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
        <div className="flex items-center gap-3">
          {placeBeforeLabelText && isManuallyMode && children}
          {!hideAutoDynamicFields(property) && (
            <AutoDynamicFields
              allowDynamicValues={allowDynamicValues}
              propertyName={propertyName}
              inputName={inputName}
              property={property}
              disabled={disabled}
            />
          )}
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
