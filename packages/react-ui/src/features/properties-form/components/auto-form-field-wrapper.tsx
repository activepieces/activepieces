import { PieceProperty } from '@activepieces/pieces-framework';
import { SquareFunction } from 'lucide-react';

import { ReadMoreDescription } from './read-more-description';

import { FormLabel } from '@/components/ui/form';
import { Toggle } from '@/components/ui/toggle';

type AutoFormFieldWrapperProps = {
  children: React.ReactNode;
  allowDynamicValues: boolean;
  property: PieceProperty;
  key: string;
  hideDescription?: boolean;
  placeBeforeLabelText?: boolean;
};

const AutoFormFieldWrapper = ({
  placeBeforeLabelText,
  children,
  hideDescription,
  allowDynamicValues,
  key,
  property,
}: AutoFormFieldWrapperProps) => {
  return (
    <>
      <FormLabel htmlFor={key} className="flex items-center">
        {placeBeforeLabelText && children}

        <span>{property.displayName}</span>
        <span className="grow"></span>
        {allowDynamicValues && (
          <Toggle>
            <SquareFunction />
          </Toggle>
        )}
      </FormLabel>
      {property.description && !hideDescription && (
        <ReadMoreDescription text={property.description} />
      )}
      {!placeBeforeLabelText && children}
    </>
  );
};

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };
