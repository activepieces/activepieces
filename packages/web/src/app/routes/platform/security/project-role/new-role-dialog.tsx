import { ErrorCode, ProjectRole, RoleType } from '@activepieces/core-utils';
import { formErrors } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { roleCopy } from '@/features/members/lib/role-copy';
import { projectRoleApi } from '@/features/platform-admin/api/project-role-api';
import { api } from '@/lib/api';

export function NewRoleDialog({
  open,
  onOpenChange,
  roles,
  startFromId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: ProjectRole[];
  startFromId?: string;
  onCreated: (role: ProjectRole) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            {startFromId ? t('Duplicate role') : t('New role')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Start from the role that comes closest, then change what it allows.',
            )}
          </DialogDescription>
        </DialogHeader>
        <NewRoleForm
          key={open ? `open-${startFromId ?? ''}` : 'closed'}
          roles={roles}
          startFromId={startFromId}
          onCancel={() => onOpenChange(false)}
          onCreated={(role) => {
            onOpenChange(false);
            onCreated(role);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function NewRoleForm({
  roles,
  startFromId,
  onCancel,
  onCreated,
}: {
  roles: ProjectRole[];
  startFromId?: string;
  onCancel: () => void;
  onCreated: (role: ProjectRole) => void;
}) {
  const sorted = roleCopy.sortProjectRoles({ roles });
  const form = useForm<NewRoleValues>({
    resolver: zodResolver(NewRoleSchema),
    defaultValues: newRoleDefaults({ roles: sorted, startFromId }),
    mode: 'onChange',
  });
  const baseId = form.watch('baseId');
  const base = sorted.find((role) => role.id === baseId);
  const { mutate, isPending } = useMutation({
    mutationFn: (values: NewRoleValues) =>
      projectRoleApi.create({
        name: values.name.trim(),
        permissions:
          sorted.find((role) => role.id === values.baseId)?.permissions ?? [],
        type: RoleType.CUSTOM,
      }),
    onSuccess: onCreated,
    onError: (error) =>
      form.setError('root.serverError', {
        type: 'manual',
        message: api.isApError(error, ErrorCode.VALIDATION)
          ? t('A role with this name already exists')
          : t('Could not save the role. Try again.'),
      }),
  });
  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((values) => {
          form.clearErrors('root.serverError');
          mutate(values);
        })}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="role-name">{t('Name')}</Label>
              <Input
                {...field}
                id="role-name"
                autoFocus
                placeholder={t('Release manager')}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="baseId"
          render={({ field }) => (
            <FormItem>
              <Label>{t('Start from')}</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sorted.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {base && (
                <FormDescription>
                  {roleCopy.plainSummary({ permissions: base.permissions })}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.serverError && (
          <p className="text-sm text-danger-11">
            {form.formState.errors.root.serverError.message}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isPending} disabled={isPending}>
            {t('Create')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function newRoleDefaults({
  roles,
  startFromId,
}: {
  roles: ProjectRole[];
  startFromId?: string;
}): NewRoleValues {
  const start = roles.find((role) => role.id === startFromId);
  const fallback =
    roles.find((role) => role.name === DEFAULT_BASE_NAME) ?? roles[0];
  return {
    name: start ? t('Copy of {name}', { name: start.name }) : '',
    baseId: start?.id ?? fallback?.id ?? '',
  };
}

const DEFAULT_BASE_NAME = 'Editor';

const NewRoleSchema = z.object({
  name: z.string().trim().min(1, formErrors.required),
  baseId: z.string().min(1, formErrors.required),
});

type NewRoleValues = z.infer<typeof NewRoleSchema>;
