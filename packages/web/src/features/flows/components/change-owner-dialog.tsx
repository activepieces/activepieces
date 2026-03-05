import { PopulatedFlow } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { projectMembersHooks } from '@/features/members/hooks/project-members-hooks';

import { flowHooks } from '../hooks/flow-hooks';

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
  const { mutate: updateOwner, isPending } = flowHooks.useUpdateFlowOwner({
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
          <DialogTitle>{t('Change Flow Owner')}</DialogTitle>
          <DialogDescription>
            {t('Select a team member to take ownership of this flow.')}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              updateOwner({ flowId: flow.id, ownerId: data.ownerId }),
            )}
          >
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
                {t('Transfer')}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export { ChangeOwnerDialog };
