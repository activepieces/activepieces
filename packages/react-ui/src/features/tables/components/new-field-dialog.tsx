import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
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
import { FieldType } from '@activepieces/shared';

const NewFieldSchema = Type.Object({
  name: Type.String(),
  type: Type.Enum(FieldType),
});

type NewFieldSchema = Static<typeof NewFieldSchema>;

type NewFieldDialogProps = {
  children: React.ReactNode;
  tableId: string;
  onFieldCreated: () => void;
};

export function NewFieldDialog({
  children,
  tableId,
  onFieldCreated,
}: NewFieldDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<NewFieldSchema>({
    resolver: typeboxResolver(NewFieldSchema),
    defaultValues: {
      name: '',
      type: FieldType.TEXT,
    },
  });

  const createFieldMutation = useMutation({
    mutationFn: async (data: NewFieldSchema) => {
      return fieldsApi.create({
        ...data,
        tableId,
      });
    },
    onSuccess: () => {
      setOpen(false);
      form.reset();
      onFieldCreated();
      toast({
        title: 'Success',
        description: 'Field has been created',
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
          <DialogTitle>Create New Field</DialogTitle>
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
                  <Label htmlFor="name">Name</Label>
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
                  <Label>Type</Label>
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
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createFieldMutation.isPending}
                disabled={!form.formState.isValid}
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
