import {
  PlatformRole,
  UpdateUserRequestBody,
  User,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useState } from 'react';
import { Resolver, useForm } from 'react-hook-form';

import { platformUserApi } from '@/api/platform-user-api';
import { adminLayout, useAdminAction } from '@/app/components/admin';
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
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

export const UpdateUserDialog = ({
  children,
  onUpdate,
  userId,
  email,
  role,
  externalId,
}: {
  children: React.ReactNode;
  onUpdate: (role: PlatformRole) => void;
  userId: string;
  email: string;
  role: PlatformRole;
  externalId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const form = useForm<{ role: PlatformRole; externalId?: string }>({
    defaultValues: {
      role,
      externalId,
    },
    resolver: zodResolver(UpdateUserRequestBody) as unknown as Resolver<{
      role: PlatformRole;
      externalId?: string;
    }>,
  });
  const { mutate, isPending } = useAdminAction<UpdateUserRequestBody, User>({
    verb: 'update',
    name: email,
    run: (request) => platformUserApi.update(userId, request),
    feedback: 'inline',
    onSuccess: ({ data }) => {
      onUpdate(data.platformRole);
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        form.reset();
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={adminLayout.dialog.sm}>
        <DialogHeader>
          <DialogTitle>{t('Edit {email}', { email })}</DialogTitle>
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
              form.clearErrors('root.serverError');
              mutate(
                {
                  platformRole: form.getValues().role,
                  externalId: form.getValues().externalId,
                },
                {
                  onError: (error) =>
                    form.setError('root.serverError', {
                      type: 'manual',
                      message: mutationFeedback.message(error),
                    }),
                },
              );
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
