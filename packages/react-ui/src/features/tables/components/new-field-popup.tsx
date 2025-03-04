import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTableState } from '@/features/tables/components/ap-table-state-provider';
import { getColumnIcon } from '@/features/tables/lib/utils';
import { cn } from '@/lib/utils';
import { FieldType, isNil } from '@activepieces/shared';

import { tableHooks } from '../lib/ap-tables-hooks';



type NewFieldDialogProps = {
  children: React.ReactNode;
  tableId: string;
};
type NewFieldFormData = {
  name: string;
  type: FieldType;
}

export function NewFieldPopup({ children, tableId }: NewFieldDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [enqueueMutation] = useTableState((state) => [state.enqueueMutation]);
  const {data: fields} = tableHooks.useFetchFields(tableId);
  const form = useForm<NewFieldFormData>({
    resolver: (data)=>{
      const errors:FieldErrors<NewFieldFormData> = {};
      if(data.name.length === 0){
       errors['name'] = {
        message: t('Please enter a field name'),
        type: 'required',
       }
      }
      else {
        if(fields?.find(field => field.name === data.name)){
          errors['name'] = {
            message: t('Please pick a unique field name'),
            type: 'unique',
          }
        }
      }
      if(isNil(data.type)){
        errors['type'] = {
          message: t('Type is required'),
          type: 'required',
        }
      }
      return {
        values: Object.keys(errors).length === 0 ? data : {},
        errors,
      }
    },
    defaultValues: {
      type: FieldType.TEXT,
    },
  });

  const createFieldMutation = tableHooks.useCreateField({
    queryClient,
    tableId
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[400px] p-4 drop-shadow-xl" align="start">
        <div className="text-lg font-semibold mb-4">{t('New Field')}</div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              form.reset();
              setOpen(false);
              await enqueueMutation(createFieldMutation, {
                ...data,
                tableId,
              });
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="name">{t('Name')}</Label>
                  <Input className='p-2 h-8' {...field} id="name" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label>{t('Type')}</Label>
                  <ScrollArea className="max-h-[200px] rounded-md border">
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="p-1"
                    >
                      {Object.values(FieldType).map((type) => (
                        <div key={type} className="flex items-center">
                          <RadioGroupItem
                            value={type}
                            id={type}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={type}
                            className={cn(
                              'flex items-center gap-2 w-full px-3 py-2 rounded-sm',
                              'text-left text-accent-foreground cursor-pointer hover:bg-muted',
                              field.value === type && 'bg-muted text-primary',
                            )}
                          >
                            {getColumnIcon(type)}
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="submit"
                size="sm"
              >
                {t('Create')}
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
