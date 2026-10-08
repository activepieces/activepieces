import { isNil } from '@activepieces/core-utils';
import {
  PlatformRole,
  UpdateUserRequestBody,
  User,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { platformUserApi } from '@/api/platform-user-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleSelector } from '@/features/members';
import { InvitedProjectSelect } from '@/features/members/components/invite-user/invited-project-select';
import { ProjectRoleSelect } from '@/features/members/components/project-role-select';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

export const UpdateUserDialog = ({
  children,
  onUpdate,
  userId,
  firstName,
  role,
  externalId,
  hasProjects,
}: UpdateUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const form = useForm<UpdateUserFormValues>({
    defaultValues: {
      role,
      externalId,
      projectId: undefined,
      projectRole: undefined,
    },
    resolver: zodResolver(UpdateUserFormValues),
  });
  const selectedRole = form.watch('role');
  const needsAProject =
    role !== PlatformRole.MEMBER &&
    selectedRole === PlatformRole.MEMBER &&
    !hasProjects &&
    platform.plan.projectRolesEnabled;

  const { mutate, isPending } = useMutation<User, Error, UpdateUserFormValues>({
    mutationKey: ['update-user'],
    mutationFn: (values) => {
      const request: UpdateUserRequestBody = {
        platformRole: values.role,
        externalId: values.externalId,
        ...(needsAProject
          ? { projectId: values.projectId, projectRole: values.projectRole }
          : {}),
      };
      return platformUserApi.update(userId, request);
    },
    onSuccess: (user) => {
      onUpdate(user.platformRole);
      setOpen(false);
    },
    onError: () => {
      form.setError('root.serverError', {
        type: 'manual',
        message: t("Couldn't change the role. Try again."),
      });
    },
  });

  const save = () => {
    form.clearErrors('root.serverError');
    const values = form.getValues();
    if (needsAProject && isNil(values.projectId)) {
      form.setError('projectId', {
        type: 'required',
        message: t('Please select a project'),
      });
      return;
    }
    if (needsAProject && isNil(values.projectRole)) {
      form.setError('projectRole', {
        type: 'required',
        message: t('Please select a project role'),
      });
      return;
    }
    mutate(values);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        form.reset();
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Update User Role')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FormField
              name="role"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="role">{t('Role')}</Label>
                  <RoleSelector
                    type="platform"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {needsAProject && (
              <>
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem className="grid space-y-2">
                      <Label>{t('Project')}</Label>
                      <InvitedProjectSelect
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <ProjectRoleSelect form={form} />
                <p className="flex items-start gap-1.5 text-xs text-gray-11">
                  <Info className="mt-px size-3.5 shrink-0" />
                  {t("Members need a project. {name} isn't in one yet.", {
                    name: firstName,
                  })}
                </p>
              </>
            )}
            <FormField
              name="externalId"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="externalId">{t('External ID')}</Label>
                  <Input
                    id="externalId"
                    value={field.value}
                    onChange={field.onChange}
                  ></Input>
                </FormItem>
              )}
            />

            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={isPending}
            loading={isPending}
            {...adminControl(AdminControl.USERS_EDIT_SUBMIT)}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              save();
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UpdateUserFormValues = z.object({
  role: z.enum(PlatformRole),
  externalId: z.string().optional(),
  projectId: z.string().optional(),
  projectRole: z.string().optional(),
});

type UpdateUserFormValues = z.infer<typeof UpdateUserFormValues>;

type UpdateUserDialogProps = {
  children: React.ReactNode;
  onUpdate: (role: PlatformRole) => void;
  userId: string;
  firstName: string;
  role: PlatformRole;
  externalId?: string;
  hasProjects: boolean;
};
