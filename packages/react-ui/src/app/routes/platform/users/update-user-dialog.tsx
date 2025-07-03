import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { platformUserApi } from '@/lib/platform-user-api';
import {
  PlatformRole,
  UpdateUserRequestBody,
  User,
} from '@activepieces/shared';

import { Input } from '../../../../components/ui/input';

export const UpdateUserDialog = ({
  children,
  onUpdate,
  userId,
  role,
  externalId,
}: {
  children: React.ReactNode;
  onUpdate: (role: PlatformRole) => void;
  userId: string;
  role: PlatformRole;
  externalId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const form = useForm<{ role: PlatformRole; externalId?: string }>({
    defaultValues: {
      role,
      externalId,
    },
    resolver: typeboxResolver(UpdateUserRequestBody),
  });
  const { toast } = useToast();
  const { mutate, isPending } = useMutation<User, Error, UpdateUserRequestBody>(
    {
      mutationKey: ['update-user'],
      mutationFn: (request) => platformUserApi.update(userId, request),
      onSuccess: (user) => {
        onUpdate(user.platformRole);
        setOpen(false);
      },
      onError: () => {
        toast(INTERNAL_ERROR_TOAST);
        setOpen(false);
      },
    },
  );

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
                  <Select
                    name="role"
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.values(PlatformRole).map((role) => (
                          <SelectItem value={role} key={role}>
                            {role === PlatformRole.ADMIN
                              ? t('Admin')
                              : t('Member')}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              mutate({
                platformRole: form.getValues().role,
                externalId: form.getValues().externalId,
              });
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
