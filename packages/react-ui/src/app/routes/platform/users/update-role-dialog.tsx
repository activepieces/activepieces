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
import { platformUserApi } from '@/features/platform-admin-panel/lib/platform-user-api';
import { PlatformRole, UpdateUserRequestBody } from '@activepieces/shared';

export const UpdateUserRoleDialog = ({
  children,
  onUpdate,
  userId,
  role,
}: {
  children: React.ReactNode;
  onUpdate: (role: PlatformRole) => void;
  userId: string;
  role: PlatformRole;
}) => {
  const [open, setOpen] = useState(false);
  const form = useForm<{ role: PlatformRole }>({
    defaultValues: {
      role,
    },
    resolver: typeboxResolver(UpdateUserRequestBody),
  });
  const { toast } = useToast();
  const { mutate, isPending } = useMutation({
    mutationKey: ['update-user'],
    mutationFn: (request: { platformRole: PlatformRole }) =>
      platformUserApi.update(userId, request),
    onSuccess: (_, request) => {
      onUpdate(request.platformRole);
      setOpen(false);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
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
                            {role}
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
              mutate({ platformRole: form.getValues().role });
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
