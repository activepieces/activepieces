import React, { useRef } from 'react';

import { ArraySubProps } from '@activepieces/pieces-framework';

import {
  useBuilderStateContext,
  useIsFocusInsideListMapperModeInput,
} from '../builder-hooks';

import { AutoPropertiesFormComponent } from './auto-properties-form';
import { TextInputWithMentions } from './text-input-with-mentions';

type BaseArrayPropertyProps = {
  inputName: string;
  disabled: boolean;
};

type ArrayPiecePropertyInListMapperModeProps = BaseArrayPropertyProps &
  (
    | { arrayProperties: ArraySubProps<boolean> }
    | {
        arrayProperties: undefined;
        onChange: (value: string) => void;
        value: string;
      }
  );

const ArrayPiecePropertyInListMapperMode = React.memo(
  (props: ArrayPiecePropertyInListMapperModeProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [
      isFocusInsideListMapperModeInput,
      setIsFocusInsideListMapperModeInput,
    ] = useBuilderStateContext((state) => [
      state.isFocusInsideListMapperModeInput,
      state.setIsFocusInsideListMapperModeInput,
    ]);
    const { inputName, disabled } = props;
    useIsFocusInsideListMapperModeInput({
      containerRef,
      setIsFocusInsideListMapperModeInput,
      isFocusInsideListMapperModeInput,
    });

    return (
      <div className="w-full" ref={containerRef}>
        {props.arrayProperties ? (
          <div className="p-4 border rounded-md flex flex-col gap-4">
            <AutoPropertiesFormComponent
              prefixValue={inputName}
              props={props.arrayProperties}
              useMentionTextInput={true}
              allowDynamicValues={false}
              disabled={disabled}
            />
          </div>
        ) : (
          <TextInputWithMentions
            disabled={disabled}
            onChange={props.onChange}
            initialValue={props.value ?? null}
          />
        )}
      </div>
    );
  },
);

ArrayPiecePropertyInListMapperMode.displayName =
  'ArrayPiecePropertyInListMapperMode';
export { ArrayPiecePropertyInListMapperMode };
