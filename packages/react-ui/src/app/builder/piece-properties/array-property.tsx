import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Plus, TrashIcon } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/sortable';
import { TextWithIcon } from '@/components/ui/text-with-icon';
import { ArrayProperty } from '@activepieces/pieces-framework';

import { AutoPropertiesFormComponent } from './auto-properties-form';
import { TextInputWithMentions } from './text-input-with-mentions';

type ArrayPropertyProps = {
  inputName: string;
  useMentionTextInput: boolean;
  arrayProperty: ArrayProperty<boolean>;
  disabled: boolean;
};

const ArrayPieceProperty = ({
  inputName,
  useMentionTextInput,
  disabled,
  arrayProperty,
}: ArrayPropertyProps) => {
  const form = useFormContext();

  const { fields, append, move, remove } = useFieldArray({
    control: form.control,
    name: inputName,
  });

  const isComplexArray = arrayProperty.properties !== undefined;

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        {isComplexArray ? (
          <>
            {fields.map((_, index) => (
              <div
                className="p-4 border rounded-md flex flex-col gap-4"
                key={'array-item-' + index}
              >
                <div className="flex justify-between">
                  <div className="font-semibold"> #{index + 1}</div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => {
                      remove(index);
                    }}
                  >
                    <TrashIcon
                      className="size-4 text-destructive"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{t('Remove')}</span>
                  </Button>
                </div>
                <AutoPropertiesFormComponent
                  prefixValue={`${inputName}.${index}`}
                  props={arrayProperty.properties!}
                  useMentionTextInput={useMentionTextInput}
                  allowDynamicValues={false}
                ></AutoPropertiesFormComponent>
              </div>
            ))}
          </>
        ) : (
          <Sortable
            value={fields}
            onMove={({ activeIndex, overIndex }) => {
              move(activeIndex, overIndex);
            }}
            overlay={
              <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
                <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
                <div className="h-8 w-full rounded-sm bg-primary/10" />
                <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
              </div>
            }
          >
            {fields.map((field, index) => (
              <SortableItem key={field.id} value={field.id} asChild>
                <div key={field.id} className="flex items-center gap-3">
                  <SortableDragHandle
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0"
                  >
                    <DragHandleDots2Icon
                      className="size-4"
                      aria-hidden="true"
                    />
                  </SortableDragHandle>
                  {arrayProperty.properties && (
                    <div className="flex flex-grow">
                      <AutoPropertiesFormComponent
                        prefixValue={`${inputName}.${index}`}
                        props={arrayProperty.properties}
                        useMentionTextInput={useMentionTextInput}
                        allowDynamicValues={false}
                      ></AutoPropertiesFormComponent>
                    </div>
                  )}
                  {!arrayProperty.properties && (
                    <FormField
                      control={form.control}
                      name={`${inputName}.${index}`}
                      render={({ field }) => (
                        <FormItem className="grow">
                          <FormControl>
                            {useMentionTextInput ? (
                              <TextInputWithMentions
                                initialValue={field.value}
                                onChange={field.onChange}
                              />
                            ) : (
                              <Input
                                value={field.value}
                                onChange={field.onChange}
                                disabled={disabled}
                                className="grow"
                              />
                            )}
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={disabled}
                    className="size-8 shrink-0"
                    onClick={() => {
                      remove(index);
                    }}
                  >
                    <TrashIcon
                      className="size-4 text-destructive"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{t('Remove')}</span>
                  </Button>
                </div>
              </SortableItem>
            ))}
          </Sortable>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => {
          append(isComplexArray ? {} : '');
        }}
        type="button"
      >
        <TextWithIcon icon={<Plus size={18} />} text={t('Add Item')} />
      </Button>
    </>
  );
};

export { ArrayPieceProperty };
