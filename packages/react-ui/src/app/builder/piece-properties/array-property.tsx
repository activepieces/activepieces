import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { Plus, TrashIcon } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import {
  Sortable,
  SortableDragHandle,
  SortableItem,
} from '@/components/ui/sortable';
import { TextWithIcon } from '@/components/ui/text-with-icon';

import { TextInputWithMentions } from './text-input-with-mentions/text-input-with-mentions';

type ArrayPropertyProps = {
  inputName: string;
};

const ArrayProperty = ({ inputName }: ArrayPropertyProps) => {
  const form = useFormContext();

  const { fields, append, move, remove } = useFieldArray({
    control: form.control,
    name: inputName,
  });

  return (
    <>
      <div className="flex w-full flex-col gap-4">
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
                  <DragHandleDots2Icon className="size-4" aria-hidden="true" />
                </SortableDragHandle>
                <FormField
                  control={form.control}
                  name={`${inputName}.${index}`}
                  render={({ field }) => (
                    <FormItem className="grow">
                      <FormControl>
                        <TextInputWithMentions
                          initialValue={field.value}
                          onChange={field.onChange}
                        ></TextInputWithMentions>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
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
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </SortableItem>
          ))}
        </Sortable>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          append('');
        }}
        type="button"
      >
        <TextWithIcon icon={<Plus size={18} />} text="Add Item" />
      </Button>
    </>
  );
};

export { ArrayProperty };
