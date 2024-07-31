import { SquareFunction } from 'lucide-react';

import { FormItem, FormLabel } from '@/components/ui/form';
import { Toggle } from '@/components/ui/toggle';
import { PieceProperty } from '@activepieces/pieces-framework';

import { ReadMoreDescription } from './read-more-description';

type AutoFormFieldWrapperProps = {
  children: React.ReactNode;
  allowDynamicValues: boolean;
  property: PieceProperty;
  hideDescription?: boolean;
  placeBeforeLabelText?: boolean;
};

const AutoFormFieldWrapper = ({
  placeBeforeLabelText = false,
  children,
  hideDescription,
  allowDynamicValues,
  property,
}: AutoFormFieldWrapperProps) => {
  return (
    <FormItem className="flex flex-col gap-1">
      <FormLabel className="flex items-center gap-1">
        {placeBeforeLabelText && children}
        <span>{property.displayName}</span>
        {property.required && <span className="text-destructive">*</span>}
        <span className="grow"></span>
        {allowDynamicValues && (
          <Toggle>
            <SquareFunction />
          </Toggle>
        )}
      </FormLabel>
      {!placeBeforeLabelText && children}
      {property.description && !hideDescription && (
        <ReadMoreDescription text={property.description} />
      )}
    </FormItem>
  );
};

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };
