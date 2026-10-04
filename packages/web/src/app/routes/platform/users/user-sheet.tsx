import {
  PlatformRole,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Fact, FactList } from '@/components/custom/fact-list';
import { InitialsTile } from '@/components/custom/list/list-cells';
import { listFormat } from '@/components/custom/list/list-format';
import { Button } from '@/components/ui/button';
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
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { internalErrorToast } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { RoleSelector } from '@/features/members';
import { platformUserMutations } from '@/features/platform-admin/hooks/platform-user-hooks';

import {
  PersonStatusDot,
  personName,
  platformRoleLabel,
  statusOf,
  UserRowData,
} from './columns';

export function UserSheet({
  row,
  onOpenChange,
  onSaved,
  onDelete,
  onSeatLimitError,
}: {
  row: UserRowData | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onDelete: (row: UserRowData) => void;
  onSeatLimitError: (error: Error) => boolean;
}) {
  return (
    <Sheet open={row !== null} onOpenChange={onOpenChange}>
      <SheetContent size="sm">
        {row && (
          <>
            <SheetHeader className="flex-row items-center gap-3">
              <InitialsTile
                name={personName({ row }) ?? row.data.email}
                className="size-9 rounded-full text-sm"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <SheetTitle className="truncate">
                  {personName({ row }) ?? row.data.email}
                </SheetTitle>
                <SheetDescription className="truncate">
                  {row.data.email}
                </SheetDescription>
              </div>
            </SheetHeader>
            {row.type === 'user' ? (
              <UserForm
                key={row.id}
                user={row.data}
                onSaved={() => {
                  onSaved();
                  onOpenChange(false);
                }}
                onCancel={() => onOpenChange(false)}
                onDelete={() => onDelete(row)}
                onSeatLimitError={onSeatLimitError}
              />
            ) : (
              <>
                <SheetBody>
                  <FactList>
                    <Fact label={t('Status')}>
                      <PersonStatusDot status={statusOf({ row })} />
                    </Fact>
                    <Fact label={t('Role')}>
                      {platformRoleLabel(row.data.platformRole)}
                    </Fact>
                    <Fact label={t('Invited')}>
                      {listFormat.dateTime(row.data.created)}
                    </Fact>
                  </FactList>
                </SheetBody>
                <SheetFooter>
                  <Button
                    variant="outline"
                    className="w-full text-danger-11 hover:text-danger-11"
                    onClick={() => onDelete(row)}
                  >
                    <Trash2 />
                    {t('Revoke invitation')}
                  </Button>
                </SheetFooter>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function UserForm({
  user,
  onSaved,
  onCancel,
  onDelete,
  onSeatLimitError,
}: {
  user: UserWithMetaInformation;
  onSaved: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onSeatLimitError: (error: Error) => boolean;
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: userDefaults({ user }),
    mode: 'onChange',
  });
  const role = form.watch('platformRole');
  const isAdmin = role === PlatformRole.ADMIN;
  const { mutate, isPending } = platformUserMutations.useUpdateUser({
    userId: user.id,
    onSuccess: onSaved,
  });
  const submit = (values: UserFormValues) => {
    form.clearErrors('root.serverError');
    mutate(
      {
        platformRole: values.platformRole,
        externalId: values.externalId.trim() || undefined,
        status: values.active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
      },
      {
        onError: (error) => {
          if (!onSeatLimitError(error)) {
            internalErrorToast();
          }
        },
      },
    );
  };
  return (
    <Form {...form}>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={form.handleSubmit(submit)}
      >
        <SheetBody>
          <FormField
            control={form.control}
            name="platformRole"
            render={({ field }) => (
              <FormItem>
                <Label>{t('Platform role')}</Label>
                <RoleSelector
                  type="platform"
                  value={field.value}
                  onValueChange={(next) => {
                    field.onChange(next);
                    if (next === PlatformRole.ADMIN) {
                      form.setValue('active', true, { shouldDirty: true });
                    }
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="externalId"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="externalId">
                  {t('External ID (optional)')}
                </Label>
                <Input {...field} id="externalId" className="font-mono" />
                <FormDescription>
                  {t('The ID this person has in your own product.')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex-row items-center justify-between gap-4 rounded-xl border p-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="active">{t('Can sign in')}</Label>
                  <FormDescription>
                    {isAdmin
                      ? t('Admins stay active. Change the role first.')
                      : t('Turn off to deactivate the account.')}
                  </FormDescription>
                </div>
                <Switch
                  id="active"
                  checked={field.value}
                  disabled={isAdmin}
                  onCheckedChange={field.onChange}
                />
              </FormItem>
            )}
          />
          <FactList>
            <Fact label={t('Last active')}>
              {listFormat.relativeDate(user.lastActiveDate)}
            </Fact>
            <Fact label={t('Joined')}>{listFormat.dateTime(user.created)}</Fact>
          </FactList>
        </SheetBody>
        <SheetFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-danger-11 hover:text-danger-11"
            onClick={onDelete}
          >
            <Trash2 />
            {t('Delete user')}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!form.formState.isDirty || isPending}
              loading={isPending}
            >
              {t('Save')}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </Form>
  );
}

function userDefaults({
  user,
}: {
  user: UserWithMetaInformation;
}): UserFormValues {
  return {
    platformRole: user.platformRole,
    externalId: user.externalId ?? '',
    active: user.status === UserStatus.ACTIVE,
  };
}

const UserFormSchema = z.object({
  platformRole: z.enum(PlatformRole),
  externalId: z.string(),
  active: z.boolean(),
});

type UserFormValues = z.infer<typeof UserFormSchema>;
