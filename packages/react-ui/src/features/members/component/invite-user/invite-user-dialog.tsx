import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { CopyIcon } from 'lucide-react';
import { useState, useRef } from 'react';
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
import { TagInput } from '@/components/ui/tag-input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlatformRoleSelect } from '@/features/members/component/platform-role-select';
import { RoleSelector } from '@/features/members/component/role-selector';
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

import { userInvitationsHooks } from '../../lib/user-invitations-hooks';

import { UserSuggestionsPopover } from './user-suggestions-popover';

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
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tagInputKey, setTagInputKey] = useState(0);
  const inputRef = useRef<HTMLDivElement>(null);
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
  const defaultProjectRole =
    roles?.find((role) => role.name === 'Editor')?.name || roles?.[0]?.name;

  const form = useForm<FormSchema>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {
      emails: [],
      type: isPlatformPage
        ? InvitationType.PLATFORM
        : platform.plan.projectRolesEnabled && project.type === ProjectType.TEAM
        ? InvitationType.PROJECT
        : InvitationType.PLATFORM,
      platformRole: PlatformRole.MEMBER,
      projectRole: defaultProjectRole,
    },
  });

  // Watch emails to update suggestions
  const currentEmails = form.watch('emails');

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

    const projectRole = data.projectRole || defaultProjectRole;
    if (data.type === InvitationType.PROJECT && !projectRole) {
      form.setError('projectRole', {
        type: 'required',
        message: t('Please select a project role'),
      });
      return;
    }

    mutate({
      ...data,
      projectRole,
    });
  };

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast.success(t('Invitation link copied successfully'), {
      duration: 3000,
    });
  };

  const handleSelectUser = (email: string) => {
    const currentEmails = form.getValues('emails');
    form.setValue('emails', [...currentEmails, email]);
    setInputValue('');
    setShowSuggestions(false);
    // Force TagInput to remount and clear its internal input state
    setTagInputKey((prev) => prev + 1);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowSuggestions(value.trim().length > 0 && !isPlatformPage);
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
            setInputValue('');
            setShowSuggestions(false);
            setTagInputKey(0);
          }}
        >
          <DialogContent className="sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle>
                {invitationLink
                  ? t('Invitation Link')
                  : isPlatformPage
                  ? t('Invite to Your Platform')
                  : t('Add Members')}
              </DialogTitle>
              <DialogDescription>
                {invitationLink ? (
                  t(
                    'Please copy the link below and share it with the user you want to invite, the invitation expires in 7 days.',
                  )
                ) : isPlatformPage ? (
                  t(
                    'Invite team members to collaborate and build amazing flows together.',
                  )
                ) : (
                  <>
                    {t('Add new members to')}{' '}
                    <span className="text-foreground font-semibold">
                      {project.displayName}
                    </span>
                    {'. '}
                    {t(
                      'They will be added immediately and receive an email notification.',
                    )}
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
                        <UserSuggestionsPopover
                          open={showSuggestions}
                          onOpenChange={setShowSuggestions}
                          inputValue={inputValue}
                          currentEmails={currentEmails}
                          onSelectUser={handleSelectUser}
                          isPlatformPage={isPlatformPage}
                        >
                          <div ref={inputRef}>
                            <TagInput
                              key={tagInputKey}
                              {...field}
                              type="email"
                              placeholder={t('Invite users by email')}
                              onInputChange={handleInputChange}
                            />
                          </div>
                        </UserSuggestionsPopover>
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
                          <RoleSelector
                            type="project"
                            value={field.value || defaultProjectRole}
                            onValueChange={field.onChange}
                            roles={roles}
                            placeholder={t('Select Role')}
                          />
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
                      {isPlatformPage ? t('Invite') : t('Add')}
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
