import React, { useEffect, useRef } from 'react';

import { ArrayProperty } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { AutoPropertiesFormComponent } from './auto-properties-form';

type ArrayPiecePropertyInListMapperModeProps = {
  inputName: string;
  arrayProperty: ArrayProperty<boolean>;
  disabled: boolean;
};

const ArrayPiecePropertyInListMapperMode = React.memo(
  ({
    inputName,
    disabled,
    arrayProperty,
  }: ArrayPiecePropertyInListMapperModeProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const setIsFocusInsideListMapperModeInput = useBuilderStateContext(
      (state) => state.setIsFocusInsideListMapperModeInput,
    );
    useEffect(() => {
      const focusInListener = () => {
        const focusedElement = document.activeElement;
        const isFocusedInside =
          !!containerRef.current?.contains(focusedElement);
        setIsFocusInsideListMapperModeInput(isFocusedInside);
      };
      document.addEventListener('focusin', focusInListener);
      return () => {
        document.removeEventListener('focusin', focusInListener);
      };
    }, [setIsFocusInsideListMapperModeInput]);
    if (isNil(arrayProperty.properties)) return <></>;
    return (
      <div className="flex w-full flex-col gap-4" ref={containerRef}>
        <div className="p-4 border rounded-md flex flex-col gap-4">
          <AutoPropertiesFormComponent
            prefixValue={inputName}
            props={arrayProperty.properties}
            useMentionTextInput={true}
            allowDynamicValues={false}
            disabled={disabled}
          />
        </div>
      </div>
    );
  },
);

ArrayPiecePropertyInListMapperMode.displayName =
  'ArrayPiecePropertyInListMapperMode';
export { ArrayPiecePropertyInListMapperMode };
