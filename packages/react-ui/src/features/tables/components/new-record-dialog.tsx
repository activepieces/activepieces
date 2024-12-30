import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { recordsApi } from '@/features/tables/lib/records-api';
import { cn, formatUtils } from '@/lib/utils';
import { Field, FieldType } from '@activepieces/shared';

type NewRecordDialogProps = {
  children: React.ReactNode;
  fields: Field[];
  tableId: string;
  onRecordCreated: () => void;
};

// Dynamically create schema based on fields
const createNewRecordSchema = (fields: Field[]) => {
  const properties: Record<string, any> = {};
  fields.forEach((field) => {
    properties[field.id] = Type.String();
  });
  return Type.Object(properties);
};

export function NewRecordDialog({
  children,
  fields,
  tableId,
  onRecordCreated,
}: NewRecordDialogProps) {
  const [open, setOpen] = useState(false);

  const NewRecordSchema = createNewRecordSchema(fields);
  type NewRecordSchema = Static<typeof NewRecordSchema>;

  const form = useForm<NewRecordSchema>({
    resolver: typeboxResolver(NewRecordSchema),
    defaultValues: fields.reduce(
      (acc, field) => ({
        ...acc,
        [field.id]: '',
      }),
      {},
    ),
  });

  const createRecordMutation = useMutation({
    mutationFn: async (data: NewRecordSchema) => {
      const cells = fields.map((field) => ({
        key: field.name,
        value: data[field.id] || '',
      }));

      return recordsApi.create({
        records: [cells],
        tableId,
      });
    },
    onSuccess: () => {
      setOpen(false);
      form.reset();
      onRecordCreated();
      toast({
        title: t('Success'),
        description: t('Record has been created.'),
        duration: 3000,
      });
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create New Record')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              createRecordMutation.mutate(data),
            )}
            className="flex flex-col gap-4"
          >
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 p-2">
                {fields.map((field) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={field.id}
                    render={({ field: formField }) => (
                      <FormItem className="grid space-y-2">
                        <Label htmlFor={field.id}>{field.name}</Label>
                        {field.type === FieldType.DATE ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !formField.value && 'text-muted-foreground',
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formField.value ? (
                                  formatUtils.formatDateOnly(
                                    new Date(formField.value),
                                  )
                                ) : (
                                  <span>{t('Pick a date')}</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={
                                  formField.value
                                    ? new Date(formField.value)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  formField.onChange(date?.toISOString() ?? '')
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <Input
                            {...formField}
                            id={field.id}
                            type={
                              field.type === FieldType.NUMBER
                                ? 'number'
                                : 'text'
                            }
                            placeholder={
                              FieldType[field.type][0] +
                              FieldType[field.type].slice(1).toLowerCase()
                            }
                          />
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createRecordMutation.isPending}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="submit"
                loading={createRecordMutation.isPending}
                disabled={!form.formState.isValid}
              >
                {t('Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
