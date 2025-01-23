import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { t } from 'i18next';
import { SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

type TasksLimitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (limit: number | undefined) => void;
  initialLimit?: number;
};

const TasksSchema = Type.Object({
  tasks: Type.Union([Type.Optional(Type.Number()), Type.Undefined()]),
});

type TasksSchema = Static<typeof TasksSchema>;

export const TasksLimitDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialLimit = 0,
}: TasksLimitDialogProps) => {
  const form = useForm<TasksSchema>({
    resolver: typeboxResolver(TasksSchema),
    defaultValues: {
      tasks: initialLimit,
    },
  });

  const updateLimits: SubmitHandler<{
    tasks: number | undefined;
  }> = (data) => {
    onSubmit(data.tasks);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Tasks Usage Limit')}</DialogTitle>
          <DialogDescription>
            {t(
              'Specify a monthly limit for tasks to avoid excessive usage. Your flows will no longer execute if this limit was reached.',
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="grid space-y-4 my-4">
            <FormField
              control={form.control}
              name="tasks"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <div className="relative">
                    <Input
                      {...field}
                      id="tasks"
                      type="number"
                      placeholder={t('Number of monthly tasks')}
                      className="rounded-sm w-full pr-8"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value);
                      }}
                    />
                    {form.watch('tasks') !== undefined && (
                      <Button
                        type="button"
                        variant="transparent"
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-xs"
                        onClick={() => {
                          field.onChange(undefined);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="justify-end">
              <DialogClose asChild>
                <Button className="text-[0.75rem]" variant="outline">
                  {t('Cancel')}
                </Button>
              </DialogClose>
              <Button
                className="w-24 text-[0.75rem]"
                onClick={(e) => form.handleSubmit(updateLimits)(e)}
              >
                {t('Save changes')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
