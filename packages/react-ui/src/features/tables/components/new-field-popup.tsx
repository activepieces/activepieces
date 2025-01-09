import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { useSequentialMutationsStore } from '@/features/tables/lib/tables-mutations-hooks';
import { getColumnIcon } from '@/features/tables/lib/utils';
import { cn } from '@/lib/utils';
import { Field, FieldType } from '@activepieces/shared';

const NewFieldSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  type: Type.Enum(FieldType),
});

type NewFieldSchema = Static<typeof NewFieldSchema>;

type NewFieldDialogProps = {
  children: React.ReactNode;
  tableId: string;
};

export function NewFieldPopup({ children, tableId }: NewFieldDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { enqueueMutation } = useSequentialMutationsStore();

  const form = useForm<NewFieldSchema>({
    resolver: typeboxResolver(NewFieldSchema),
    defaultValues: {
      type: FieldType.TEXT,
    },
  });

  const createFieldMutation = useMutation({
    mutationKey: ['createField'],
    mutationFn: async (data: NewFieldSchema) => {
      return fieldsApi.create({
        tableId,
        name: data.name,
        type: data.type,
      });
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['fields', tableId] });
      const previousFields = queryClient.getQueryData(['fields', tableId]);

      // Create an optimistic field
      const optimisticField: Field = {
        id: 'temp-' + Date.now(),
        name: data.name,
        type: data.type,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        tableId,
        projectId: '',
      };

      queryClient.setQueryData(['fields', tableId], (old: Field[]) => [
        ...(old || []),
        optimisticField,
      ]);

      return { previousFields, optimisticField };
    },
    onError: (error, variables, context) => {
      if (context?.previousFields) {
        queryClient.setQueryData(['fields', tableId], context.previousFields);
      }
      toast(INTERNAL_ERROR_TOAST);
    },
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
    onSettled: (data, error, variables, context) => {
      if (data && context?.optimisticField) {
        // Replace the optimistic field with the real one
        queryClient.setQueryData(['fields', tableId], (old: Field[]) =>
          old.map((field: Field) =>
            field.id === context.optimisticField.id ? data : field,
          ),
        );
      }
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[400px] p-4" align="start">
        <div className="text-lg font-semibold mb-4">{t('New Field')}</div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              await enqueueMutation(createFieldMutation, data);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="name">{t('Name')}</Label>
                  <Input {...field} id="name" />
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
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createFieldMutation.isPending}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid}
                onClick={() => setOpen(false)}
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
