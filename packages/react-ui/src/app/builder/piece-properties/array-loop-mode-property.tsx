import React from 'react';
import { useFormContext } from 'react-hook-form';

import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrayProperty } from '@activepieces/pieces-framework';

import { AutoPropertiesFormComponent } from './auto-properties-form';
import { TextInputWithMentions } from './text-input-with-mentions';

type ArrayPiecePropertyInLoopModeProps = {
  inputName: string;
  useMentionTextInput: boolean;
  arrayProperty: ArrayProperty<boolean>;
  disabled: boolean;
};

const ArrayPiecePropertyInLoopMode = React.memo(
  ({
    inputName,
    useMentionTextInput,
    disabled,
    arrayProperty,
  }: ArrayPiecePropertyInLoopModeProps) => {
    const form = useFormContext();

    return (
      <div className="flex w-full flex-col gap-4">
        {arrayProperty.properties ? (
          <div className="p-4 border rounded-md flex flex-col gap-4">
            <AutoPropertiesFormComponent
              prefixValue={inputName}
              props={arrayProperty.properties}
              useMentionTextInput={useMentionTextInput}
              allowDynamicValues={false}
              disabled={disabled}
            />
          </div>
        ) : (
          <FormField
            control={form.control}
            name={inputName}
            render={() => (
              <FormItem className="grow">
                <FormControl>
                  {useMentionTextInput ? (
                    <TextInputWithMentions
                      initialValue={form.getValues(inputName) as string}
                      onChange={(value) => {
                        form.setValue(inputName, value, { shouldValidate: true });
                      }}
                      disabled={disabled}
                    />
                  ) : (
                    <Input
                      value={form.getValues(inputName) as string}
                      onChange={(e) => {
                        form.setValue(inputName, e.target.value, {
                          shouldValidate: true,
                        });
                      }}
                      disabled={disabled}
                      className="grow"
                    />
                  )}
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
    );
  },
);

ArrayPiecePropertyInLoopMode.displayName = 'ArrayPiecePropertyInLoopMode';
export { ArrayPiecePropertyInLoopMode };
