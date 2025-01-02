import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { fieldsApi } from '@/features/tables/lib/fields-api';
import { Field, FieldType } from '@activepieces/shared';

const NewFieldSchema = Type.Object({
  name: Type.String(),
  type: Type.Enum(FieldType),
});

type NewFieldSchema = Static<typeof NewFieldSchema>;

type NewFieldDialogProps = {
  children: React.ReactNode;
  tableId: string;
};

export function NewFieldDialog({ children, tableId }: NewFieldDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<NewFieldSchema>({
    resolver: typeboxResolver(NewFieldSchema),
  });

  const createFieldMutation = useMutation({
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
      toast({
        title: t('Success'),
        description: t('Field has been created.'),
        duration: 3000,
      });
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create New Field')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              createFieldMutation.mutate(data),
            )}
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(FieldType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
