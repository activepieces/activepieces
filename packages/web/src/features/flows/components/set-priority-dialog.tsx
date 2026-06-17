import {
  FlowOperationType,
  FlowPriority,
  PopulatedFlow,
} from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { flowsApi } from '../api/flows-api';

const DEFAULT_PRIORITY = 'default';

const SetPriorityFormSchema = Type.Object({
  priority: Type.String(),
});

type SetPriorityFormSchema = Static<typeof SetPriorityFormSchema>;

type SetPriorityDialogProps = {
  children: React.ReactNode;
  flow: PopulatedFlow;
};

const SetPriorityDialog = ({ children, flow }: SetPriorityDialogProps) => {
  const [isDialogOpened, setIsDialogOpened] = useState(false);

  const priorityOptions: { value: FlowPriority; label: string }[] = [
    { value: FlowPriority.CRITICAL, label: t('Critical') },
    { value: FlowPriority.HIGH, label: t('High') },
    { value: FlowPriority.MEDIUM, label: t('Medium') },
    { value: FlowPriority.LOW, label: t('Low') },
    { value: FlowPriority.VERY_LOW, label: t('Very Low') },
    { value: FlowPriority.LOWEST, label: t('Lowest') },
  ];

  const form = useForm<SetPriorityFormSchema>({
    resolver: typeboxResolver(SetPriorityFormSchema),
    defaultValues: {
      priority: flow.priority ?? DEFAULT_PRIORITY,
    },
  });

  useEffect(() => {
    if (isDialogOpened) {
      form.reset({ priority: flow.priority ?? DEFAULT_PRIORITY });
    }
  }, [isDialogOpened, flow.priority, form]);

  const { mutate, isPending } = useMutation<
    PopulatedFlow,
    Error,
    SetPriorityFormSchema
  >({
    mutationFn: async (data) => {
      return await flowsApi.update(flow.id, {
        type: FlowOperationType.UPDATE_PRIORITY,
        request: {
          priority:
            data.priority === DEFAULT_PRIORITY
              ? null
              : (data.priority as FlowPriority),
        },
      });
    },
    onSuccess: () => {
      setIsDialogOpened(false);
      toast.success(t('Flow priority has been updated'));
    },
  });

  return (
    <Dialog onOpenChange={setIsDialogOpened} open={isDialogOpened}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Set Priority')}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit((data) => mutate(data))}>
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select a priority')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEFAULT_PRIORITY}>
                        {t('Default (automatic)')}
                      </SelectItem>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" loading={isPending}>
                {t('Confirm')}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export { SetPriorityDialog };
