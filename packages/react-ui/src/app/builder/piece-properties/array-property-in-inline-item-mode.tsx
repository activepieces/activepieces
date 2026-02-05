import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';
import { ArraySubProps } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';
import { flowCanvasHooks } from '../flow-canvas/hooks';

import { GenericPropertiesForm } from './generic-properties-form';
import { TextInputWithMentions } from './text-input-with-mentions';

type BaseArrayPropertyProps = {
  inputName: string;
  disabled: boolean;
};

type ArrayPiecePropertyInInlineItemModeProps = BaseArrayPropertyProps &
  (
    | { arrayProperties: ArraySubProps<boolean> }
    | {
        arrayProperties: undefined;
        onChange: (value: string) => void;
        value: string;
      }
  );

const ArrayPiecePropertyInInlineItemMode = React.memo(
  (props: ArrayPiecePropertyInInlineItemModeProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [
      isFocusInsideListMapperModeInput,
      setIsFocusInsideListMapperModeInput,
    ] = useBuilderStateContext((state) => [
      state.isFocusInsideListMapperModeInput,
      state.setIsFocusInsideListMapperModeInput,
    ]);
    const { inputName, disabled } = props;
    flowCanvasHooks.useIsFocusInsideListMapperModeInput({
      containerRef,
      setIsFocusInsideListMapperModeInput,
      isFocusInsideListMapperModeInput,
    });
    useFixInlineArrayPropertyValue(inputName, props);
    return (
      <div className="w-full" ref={containerRef}>
        {props.arrayProperties ? (
          <div
            className={cn(
              'p-4 border rounded-md flex flex-col',
              GAP_SIZE_FOR_STEP_SETTINGS,
            )}
          >
            <GenericPropertiesForm
              prefixValue={inputName}
              props={props.arrayProperties}
              useMentionTextInput={true}
              propertySettings={null}
              disabled={disabled}
              dynamicPropsInfo={null}
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

ArrayPiecePropertyInInlineItemMode.displayName =
  'ArrayPiecePropertyInInlineItemMode';
export { ArrayPiecePropertyInInlineItemMode };

/**
 * we had a bug where the value for inline array property was not an object
 * this will always insure the value is an object
 */
const useFixInlineArrayPropertyValue = (
  inputName: string,
  props: ArrayPiecePropertyInInlineItemModeProps,
) => {
  const form = useFormContext();
  useEffect(() => {
    const value = form.getValues(inputName);
    if (
      props.arrayProperties &&
      (isNil(value) || typeof value !== 'object' || Array.isArray(value))
    ) {
      form.setValue(inputName, {}, { shouldValidate: true });
    }
  }, []);
};
