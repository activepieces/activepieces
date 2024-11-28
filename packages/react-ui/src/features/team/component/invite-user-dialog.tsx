import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { CopyIcon, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { projectRoleApi } from '@/features/platform-admin-panel/lib/project-role-api';
import { PlatformRoleSelect } from '@/features/team/component/platform-role-select';
import { userInvitationApi } from '@/features/team/lib/user-invitation';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { HttpError } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import {
  InvitationType,
  isNil,
  Permission,
  PlatformRole,
  UserInvitationWithLink,
} from '@activepieces/shared';

import { userInvitationsHooks } from '../lib/user-invitations-hooks';

const FormSchema = Type.Object({
  email: Type.String({
    errorMessage: t('Please enter a valid email address'),
    pattern: formatUtils.emailRegex.source,
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

export function InviteUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const { platform } = platformHooks.useCurrentPlatform();
  const { refetch } = userInvitationsHooks.useInvitations();
  const { project } = projectHooks.useCurrentProject();
  const currentUser = authenticationSession.getCurrentUser();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToInviteUser = checkAccess(
    Permission.WRITE_INVITATION,
  );

  const { mutate, isPending } = useMutation<
    UserInvitationWithLink,
    HttpError,
    FormSchema
  >({
    mutationFn: (data) => {
      switch (data.type) {
        case InvitationType.PLATFORM:
          return userInvitationApi.invite({
            email: data.email.trim().toLowerCase(),
            type: data.type,
            platformRole: data.platformRole,
          });
        case InvitationType.PROJECT:
          return userInvitationApi.invite({
            email: data.email.trim().toLowerCase(),
            type: data.type,
            projectRole: data.projectRole!,
            projectId: project.id,
          });
      }
    },
    onSuccess: (res) => {
      if (res.link) {
        setInvitationLink(res.link);
      } else {
        setIsOpen(false);
        toast({
          title: t('Invitation sent successfully'),
        });
      }
      refetch();
      //TODO: navigate to platform admin users
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
    enabled:
      !isNil(platform.projectRolesEnabled) && platform.projectRolesEnabled,
  });

  const roles = rolesData?.data ?? [];

  const form = useForm<FormSchema>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {
      email: '',
      type: platform.projectRolesEnabled
        ? InvitationType.PROJECT
        : InvitationType.PLATFORM,
      platformRole: PlatformRole.ADMIN,
      projectRole: roles?.[0]?.name,
    },
  });

  const onSubmit = (data: FormSchema) => {
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
    toast({
      title: t('Invitation link copied successfully'),
    });
  };

  return (
    userHasPermissionToInviteUser && (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            form.reset();
            setInvitationLink('');
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant={'outline'}
            size="sm"
            className="flex items-center justify-center gap-2 w-full"
          >
            <Plus className="size-4" />
            <span>{t('Invite User')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {invitationLink ? t('Invitation Link') : t('Invite User')}
            </DialogTitle>
            <DialogDescription>
              {invitationLink
                ? t(
                    'Please copy the link below and share it with the user you want to invite, the invitation expires in 24 hours.',
                  )
                : t(
                    'Type the email address of the user you want to invite, the invitation expires in 24 hours.',
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
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <Label htmlFor="email">{t('Email')}</Label>
                      <Input {...field} type="text" placeholder="jon@doe.com" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <Label>{t('Invite To')}</Label>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('Invite To')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>{t('Invite To')}</SelectLabel>
                            {currentUser?.platformRole ===
                              PlatformRole.ADMIN && (
                              <SelectItem value={InvitationType.PLATFORM}>
                                {t('Entire Platform')}
                              </SelectItem>
                            )}
                            {platform.projectRolesEnabled && (
                              <SelectItem value={InvitationType.PROJECT}>
                                {project.displayName} (Current)
                              </SelectItem>
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>

                {form.getValues().type === InvitationType.PLATFORM && (
                  <PlatformRoleSelect form={form} />
                )}
                {form.getValues().type === InvitationType.PROJECT && (
                  <FormField
                    control={form.control}
                    name="projectRole"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <Label>{t('Select Project Role')}</Label>
                        <Select
                          onValueChange={(value) => {
                            const selectedRole = roles.find(
                              (role) => role.name === value,
                            );
                            field.onChange(selectedRole?.name);
                          }}
                          defaultValue={field.value}
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
                  className=" rounded-l-md rounded-r-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
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
    )
  );
}
