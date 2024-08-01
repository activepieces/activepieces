import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { Plus, TrashIcon } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Input } from '@/components/ui/input';

import { Button } from './button';
import { FormControl, FormField, FormItem } from './form';
import { Sortable, SortableDragHandle, SortableItem } from './sortable';
import { TextWithIcon } from './text-with-icon';

type ArrayInputProps = {
  inputName: string;
};

const ArrayInput = ({ inputName }: ArrayInputProps) => {
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
                        <Input className="h-8" {...field} />
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

export { ArrayInput };
