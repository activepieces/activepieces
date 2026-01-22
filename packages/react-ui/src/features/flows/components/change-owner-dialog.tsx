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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { FlowOperationType, PopulatedFlow } from '@activepieces/shared';

import { flowsApi } from '../lib/flows-api';

const ChangeOwnerFormSchema = Type.Object({
  ownerId: Type.String({
    errorMessage: t('Please select an owner'),
  }),
});

type ChangeOwnerFormSchema = Static<typeof ChangeOwnerFormSchema>;

type ChangeOwnerDialogProps = {
  children: React.ReactNode;
  flow: PopulatedFlow;
  onOwnerChange: () => void;
};

const ChangeOwnerDialog = ({
  children,
  flow,
  onOwnerChange,
}: ChangeOwnerDialogProps) => {
  const { projectMembers, isLoading } = projectMembersHooks.useProjectMembers();
  const [isDialogOpened, setIsDialogOpened] = useState(false);

  const form = useForm<ChangeOwnerFormSchema>({
    resolver: typeboxResolver(ChangeOwnerFormSchema),
    defaultValues: {
      ownerId: flow.ownerId ?? '',
    },
  });

  useEffect(() => {
    if (isDialogOpened) {
      form.reset({
        ownerId: flow.ownerId ?? '',
      });
    }
  }, [isDialogOpened, flow.ownerId, form]);
  const { mutate, isPending } = useMutation<
    PopulatedFlow,
    Error,
    ChangeOwnerFormSchema
  >({
    mutationFn: async (data) => {
      return await flowsApi.update(flow.id, {
        type: FlowOperationType.UPDATE_OWNER,
        request: {
          ownerId: data.ownerId,
        },
      });
    },
    onSuccess: () => {
      onOwnerChange();
      setIsDialogOpened(false);
      toast.success(t('Flow owner has been updated'));
    },
  });

  return (
    <Dialog onOpenChange={setIsDialogOpened} open={isDialogOpened}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Change Owner')}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit((data) => mutate(data))}>
            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={
                      isLoading ||
                      !projectMembers ||
                      projectMembers.length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select Owner')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {projectMembers &&
                          projectMembers.length > 0 &&
                          projectMembers.map((member) => (
                            <SelectItem
                              key={member.userId}
                              value={member.userId}
                            >
                              {member.user.firstName} {member.user.lastName} (
                              {member.user.email})
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
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

export { ChangeOwnerDialog };
