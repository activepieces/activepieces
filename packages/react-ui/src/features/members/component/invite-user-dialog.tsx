import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField, FormItem, Form, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/ui/tag-input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlatformRoleSelect } from '@/features/members/component/platform-role-select';
import { userInvitationApi } from '@/features/members/lib/user-invitation';
import { projectRoleApi } from '@/features/platform-admin/lib/project-role-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { HttpError } from '@/lib/api';
import { formatUtils } from '@/lib/utils';
import {
  InvitationType,
  isNil,
  Permission,
  PlatformRole,
  ProjectType,
  UserInvitationWithLink,
} from '@activepieces/shared';

import { userInvitationsHooks } from '../lib/user-invitations-hooks';

const FormSchema = Type.Object({
  emails: Type.Array(Type.String(), {
    errorMessage: t('Please enter at least one email address'),
    minItems: 1,
  }),
  type: Type.Enum(InvitationType, {
    errorMessage: t('Please select invitation type'),
    required: true,
  }),
  platformRole: Type.Enum(PlatformRole, {
    errorMessage: t('Please select platform role'),
    required: true,
  }),
  projectRole: Type.Optional(
    Type.String({
      required: true,
    }),
  ),
});

type FormSchema = Static<typeof FormSchema>;

export const InviteUserDialog = ({
  open,
  setOpen,
  onInviteSuccess,
}: {
  open: boolean;
  setOpen: (_open: boolean) => void;
  onInviteSuccess?: () => void;
}) => {
  const { embedState } = useEmbedding();
  const [invitationLink, setInvitationLink] = useState('');
  const { platform } = platformHooks.useCurrentPlatform();
  const { refetch } = userInvitationsHooks.useInvitations();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const location = useLocation();
  const isPlatformPage = location.pathname.includes('/platform/');
  const userHasPermissionToInviteUser = checkAccess(
    Permission.WRITE_INVITATION,
  );

  const { mutate, isPending } = useMutation<
    UserInvitationWithLink,
    HttpError,
    FormSchema
  >({
    mutationFn: async (data) => {
      const promises = data.emails.map((email) =>
        data.type === InvitationType.PLATFORM
          ? userInvitationApi.invite({
              email: email.trim().toLowerCase(),
              type: data.type,
              platformRole: data.platformRole,
            })
          : userInvitationApi.invite({
              email: email.trim().toLowerCase(),
              type: data.type,
              projectRole: data.projectRole!,
              projectId: project.id,
            }),
      );

      const results = await Promise.all(promises);
      return results[0];
    },
    onSuccess: (res) => {
      if (res.link) {
        setInvitationLink(res.link);
      } else {
        setOpen(false);
        form.reset();
        toast.success(t('Invitation sent successfully'), {
          duration: 3000,
        });
      }
      refetch();
      onInviteSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || t('Failed to send invitations'), {
        duration: 4000,
      });
    },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
    enabled:
      !isNil(platform.plan.projectRolesEnabled) &&
      platform.plan.projectRolesEnabled,
  });

  const roles = rolesData?.data ?? [];
  const defaultProjectRole = roles?.find((role) => role.name === 'Editor')?.name || roles?.[0]?.name;

  const form = useForm<FormSchema>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {
      emails: [],
      type: isPlatformPage
        ? InvitationType.PLATFORM
        : platform.plan.projectRolesEnabled && project.type === ProjectType.TEAM
        ? InvitationType.PROJECT
        : InvitationType.PLATFORM,
      platformRole: PlatformRole.ADMIN,
      projectRole: defaultProjectRole,
    },
  });

  const onSubmit = (data: FormSchema) => {
    if (data.emails.length === 0) {
      form.setError('emails', {
        type: 'required',
        message: t('Please enter at least one email address'),
      });
      return;
    }

    const invalidEmails = data.emails.filter(
      (email) => !formatUtils.emailRegex.test(email.trim()),
    );

    if (invalidEmails.length > 0) {
      form.setError('emails', {
        type: 'validation',
        message: t('Please fix invalid email addresses'),
      });
      return;
    }

    if (data.type === InvitationType.PROJECT && !data.projectRole) {
      form.setError('projectRole', {
        type: 'required',
        message: t('Please select a project role'),
      });
      return;
    }
    mutate(data);
  };

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast.success(t('Invitation link copied successfully'), {
      duration: 3000,
    });
  };

  if (embedState.isEmbedded || !userHasPermissionToInviteUser) {
    return null;
  }

  return (
    <>
      {
        <Dialog
          open={open}
          modal
          onOpenChange={(open) => {
            setOpen(open);
            form.reset();
            setInvitationLink('');
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {invitationLink ? t('Invitation Link') : t('Invite User')}
              </DialogTitle>
              <DialogDescription>
                {invitationLink
                  ? t(
                      'Please copy the link below and share it with the user you want to invite, the invitation expires in 7 days.',
                    )
                  : isPlatformPage
                  ? t(
                      'Type email addresses separated by commas to invite multiple users to the entire platform. Invitations expire in 7 days.',
                    )
                  : (
                      <>
                        {t('Type email addresses separated by commas to add members to')}{' '}
                        <span className="text-foreground font-semibold">{project.displayName}</span>.{' '}
                        {t('Invitations expire in 7 days')}.
                      </>
                    )}
              </DialogDescription>
            </DialogHeader>

            {!invitationLink ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  <FormField
                    control={form.control}
                    name="emails"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <Label htmlFor="emails">{t('Emails')}</Label>
                        <TagInput
                          {...field}
                          placeholder={t('Invite users by email')}
                          validateItem={(email) =>
                            formatUtils.emailRegex.test(email.trim())
                          }
                          badgeClassName="rounded-sm border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 font-normal"
                          invalidBadgeClassName="bg-destructive border-destructive text-white font-light"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.getValues().type === InvitationType.PLATFORM && (
                    <PlatformRoleSelect form={form} />
                  )}
                  {form.getValues().type === InvitationType.PROJECT && (
                    <FormField
                      control={form.control}
                      name="projectRole"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <Label>{t('Project Role')}</Label>
                          <Select
                            onValueChange={(value) => {
                              const selectedRole = roles.find(
                                (role) => role.name === value,
                              );
                              field.onChange(selectedRole?.name);
                            }}
                            value={field.value || defaultProjectRole}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('Select Role')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>{t('Roles')}</SelectLabel>
                                {roles.map((role) => (
                                  <SelectItem key={role.name} value={role.name}>
                                    {role.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form?.formState?.errors?.root?.serverError && (
                    <FormMessage>
                      {form.formState.errors.root.serverError.message}
                    </FormMessage>
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant={'outline'}>
                        {t('Cancel')}
                      </Button>
                    </DialogClose>
                    <Button type="submit" loading={isPending}>
                      {t('Invite')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            ) : (
              <>
                <Label htmlFor="invitationLink" className="mb-2">
                  {t('Invitation Link')}
                </Label>
                <div className="flex">
                  <Input
                    name="invitationLink"
                    type="text"
                    readOnly={true}
                    defaultValue={invitationLink}
                    placeholder={t('Invitation Link')}
                    onFocus={(event) => {
                      event.target.select();
                      copyInvitationLink();
                    }}
                    className=" rounded-l-md rounded-r-none focus-visible:ring-0! focus-visible:ring-offset-0!"
                  />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={'outline'}
                        className=" rounded-l-none rounded-r-md"
                        onClick={copyInvitationLink}
                      >
                        <CopyIcon height={15} width={15}></CopyIcon>
                      </Button>
                    </TooltipTrigger>

                    <TooltipContent side="bottom">{t('Copy')}</TooltipContent>
                  </Tooltip>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      }
    </>
  );
};
