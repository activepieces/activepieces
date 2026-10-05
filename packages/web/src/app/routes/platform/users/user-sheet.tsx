import { isNil } from '@activepieces/core-utils';
import {
  PlatformRole,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Trash2, XIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Fact, FactList } from '@/components/custom/fact-list';
import { useGuardedClose } from '@/components/custom/leave-without-saving';
import { InitialsTile } from '@/components/custom/list/list-cells';
import { listFormat } from '@/components/custom/list/list-format';
import {
  isToastInteraction,
  SaveBar,
} from '@/components/custom/settings-parts';
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
import { Switch } from '@/components/ui/switch';
import { RoleSelector } from '@/features/members';
import { platformUserMutations } from '@/features/platform-admin/hooks/platform-user-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { authenticationSession } from '@/lib/authentication-session';
import { mutationFeedback } from '@/lib/mutation-feedback';

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
      {row?.type === 'user' && (
        <UserSheetContent
          key={row.id}
          row={row}
          user={row.data}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
          onDelete={() => onDelete(row)}
          onSeatLimitError={onSeatLimitError}
        />
      )}
      {row?.type === 'invitation' && (
        <SheetContent
          size="sm"
          onInteractOutside={(event) => {
            if (isToastInteraction(event)) {
              event.preventDefault();
            }
          }}
        >
          <PersonSheetHeader row={row} />
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
              {...adminControl(AdminControl.USERS_DELETE_OPEN)}
              onClick={() => onDelete(row)}
            >
              <Trash2 />
              {t('Revoke invitation')}
            </Button>
          </SheetFooter>
        </SheetContent>
      )}
    </Sheet>
  );
}

function PersonSheetHeader({ row }: { row: UserRowData }) {
  return (
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
  );
}

function UserSheetContent({
  row,
  user,
  onClose,
  onSaved,
  onDelete,
  onSeatLimitError,
}: {
  row: UserRowData;
  user: UserWithMetaInformation;
  onClose: () => void;
  onSaved: () => void;
  onDelete: () => void;
  onSeatLimitError: (error: Error) => boolean;
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      userFormSchema({ hadExternalId: !isNil(user.externalId) }),
    ),
    defaultValues: userDefaults({ user }),
    mode: 'onChange',
  });
  const role = form.watch('platformRole');
  const isAdmin = role === PlatformRole.ADMIN;
  const isSelf = user.id === authenticationSession.getCurrentUserId();
  const dirty = form.formState.isDirty;
  const invalid = !form.formState.isValid;
  const serverError = form.formState.errors.root?.serverError?.message;
  const { requestClose, dialog } = useGuardedClose({ dirty, onClose });
  const guardDismiss = (event: Event) => {
    if (isToastInteraction(event)) {
      event.preventDefault();
      return;
    }
    if (dirty) {
      event.preventDefault();
      requestClose();
    }
  };
  const { mutate, isPending } = platformUserMutations.useUpdateUser({
    userId: user.id,
    onSuccess: (saved) => {
      form.reset(userDefaults({ user: { ...user, ...saved } }));
      toast.success(t('Changes saved'));
      onSaved();
    },
    onError: (error) => {
      if (onSeatLimitError(error)) {
        return;
      }
      form.setError('root.serverError', {
        type: 'manual',
        message: mutationFeedback.message(error),
      });
    },
  });
  const submit = (values: UserFormValues) => {
    if (isPending) {
      return;
    }
    form.clearErrors('root.serverError');
    const externalId = values.externalId.trim();
    mutate({
      platformRole: isSelf ? undefined : values.platformRole,
      externalId: externalId.length > 0 ? externalId : undefined,
      status: values.active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
    });
  };
  return (
    <SheetContent
      size="sm"
      showCloseButton={false}
      onEscapeKeyDown={guardDismiss}
      onInteractOutside={guardDismiss}
    >
      <PersonSheetHeader row={row} />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-6 right-6"
        aria-label={t('Close')}
        onClick={requestClose}
      >
        <XIcon />
      </Button>
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
                    disabled={isSelf}
                    onValueChange={(next) => {
                      field.onChange(next);
                      if (next === PlatformRole.ADMIN) {
                        form.setValue('active', true, { shouldDirty: true });
                      }
                    }}
                  />
                  {isSelf && (
                    <FormDescription>
                      {t(
                        "You can't change your own role. Ask another admin to do it.",
                      )}
                    </FormDescription>
                  )}
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
                    disabled={isAdmin || isSelf}
                    onCheckedChange={field.onChange}
                  />
                </FormItem>
              )}
            />
            <FactList>
              <Fact label={t('Last active')}>
                {listFormat.relativeDate(user.lastActiveDate)}
              </Fact>
              <Fact label={t('Joined')}>
                {listFormat.dateTime(user.created)}
              </Fact>
            </FactList>
          </SheetBody>
          <SheetFooter className="sm:items-center">
            {dirty || serverError ? (
              <SaveBar
                dirty={dirty}
                saving={isPending}
                invalid={invalid}
                error={serverError}
                onDiscard={() => form.reset()}
                saveControl={AdminControl.USERS_EDIT_SUBMIT}
              />
            ) : isSelf ? null : (
              <Button
                type="button"
                variant="outline"
                className="w-full text-danger-11 hover:text-danger-11"
                {...adminControl(AdminControl.USERS_DELETE_OPEN)}
                onClick={onDelete}
              >
                <Trash2 />
                {t('Delete user')}
              </Button>
            )}
          </SheetFooter>
        </form>
      </Form>
      {dialog}
    </SheetContent>
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

export function userFormSchema({ hadExternalId }: { hadExternalId: boolean }) {
  return z.object({
    platformRole: z.enum(PlatformRole),
    externalId: z
      .string()
      .refine((value) => !hadExternalId || value.trim().length > 0, {
        message: EXTERNAL_ID_REQUIRED,
      }),
    active: z.boolean(),
  });
}

const EXTERNAL_ID_REQUIRED =
  "An external ID can't be removed once set. Enter a new one instead.";

type UserFormValues = z.infer<ReturnType<typeof userFormSchema>>;
