import React, { useEffect, useRef } from 'react';

import { ArrayProperty } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { AutoPropertiesFormComponent } from './auto-properties-form';
import { textMentionUtils } from './text-input-with-mentions/text-input-utils';

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
    const [
      isFocusInsideListMapperModeInput,
      setIsFocusInsideListMapperModeInput,
    ] = useBuilderStateContext((state) => [
      state.isFocusInsideListMapperModeInput,
      state.setIsFocusInsideListMapperModeInput,
    ]);
    useEffect(() => {
      const focusInListener = () => {
        const focusedElement = document.activeElement;
        const isFocusedInside =
          !!containerRef.current?.contains(focusedElement);
        const isFocusedInsideDataSelector =
          !isNil(document.activeElement) &&
          document.activeElement instanceof HTMLElement &&
          textMentionUtils.isDataSelectorOrChildOfDataSelector(
            document.activeElement,
          );
        setIsFocusInsideListMapperModeInput(
          isFocusedInside ||
            (isFocusedInsideDataSelector && isFocusInsideListMapperModeInput),
        );
      };
      document.addEventListener('focusin', focusInListener);
      return () => {
        document.removeEventListener('focusin', focusInListener);
      };
    }, [setIsFocusInsideListMapperModeInput, isFocusInsideListMapperModeInput]);
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
