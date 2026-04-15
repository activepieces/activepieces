import {
  InvitationType,
  Permission,
  PlatformRole,
  ProjectType,
  UserInvitationWithLink,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { CopyIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { useEmbedding } from '@/components/providers/embed-provider';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import { projectMembersHooks } from '@/features/members/hooks/project-members-hooks';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { PlatformRoleSelect } from '@/features/members/components/platform-role-select';
import { ProjectRoleSelect } from '@/features/members/components/project-role-select';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { HttpError } from '@/lib/api';
import { formatUtils } from '@/lib/format-utils';

import { userInvitationsHooks } from '../../hooks/user-invitations-hooks';

import { UserSuggestionsPopover } from './user-suggestions-popover';

const buildInvalidEmailsMessage = (emails: string[]): string => {
  const maxShown = 3;
  const shown = emails.slice(0, maxShown);
  const remaining = emails.length - maxShown;
  if (remaining > 0) {
    return t('Fix invalid emails {list} and {count} more', {
      list: shown.join(', '),
      count: remaining,
    });
  }
  if (shown.length === 1) {
    return t('Fix invalid email {email}', { email: shown[0] });
  }
  const last = shown.pop();
  return t('Fix invalid emails {list} and {last}', {
    list: shown.join(', '),
    last,
  });
};

const FormSchema = z.object({
  emails: z.array(z.string()).superRefine((emails, ctx) => {
    if (emails.length === 0) return;
    const invalidEmails = emails.filter(
      (email) => !formatUtils.emailRegex.test(email.trim()),
    );
    if (invalidEmails.length === 0) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: buildInvalidEmailsMessage(invalidEmails),
    });
  }),
  type: z.nativeEnum(InvitationType, {
    message: t('Please select invitation type'),
  }),
  platformRole: z.nativeEnum(PlatformRole, {
    message: t('Please select platform role'),
  }),
  projectRole: z.string().optional(),
});

type FormSchema = z.infer<typeof FormSchema>;

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
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const { refetch } = userInvitationsHooks.useInvitations();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const location = useLocation();
  const isPlatformPage = location.pathname.includes('/platform/');
  const userHasPermissionToInviteUser = checkAccess(
    Permission.WRITE_INVITATION,
  );
  const { data: platformUsersData } = platformUserHooks.useUsers();
  const platformUserEmails = new Set(
    platformUsersData?.data.map((u) => u.email.toLowerCase()) ?? [],
  );
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const projectMemberEmails = new Set(
    projectMembers?.map((m) => m.user.email.toLowerCase()) ?? [],
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

  const form = useForm<FormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      emails: [],
      type: isPlatformPage
        ? InvitationType.PLATFORM
        : platform.plan.projectRolesEnabled && project.type === ProjectType.TEAM
        ? InvitationType.PROJECT
        : InvitationType.PLATFORM,
      platformRole: PlatformRole.MEMBER,
      projectRole: undefined,
    },
  });

  const handleEmailsChange = useCallback(
    (emails: ReadonlyArray<string>) => {
      const filtered = emails.filter((e) => {
        const lower = e.toLowerCase();
        if (isPlatformPage) return !platformUserEmails.has(lower);
        return !projectMemberEmails.has(lower);
      });
      form.setValue('emails', [...filtered]);
      form.trigger('emails');
    },
    [form, isPlatformPage, platformUserEmails, projectMemberEmails],
  );

  const onSubmit = (data: FormSchema) => {
    if (data.emails.length === 0) {
      form.setError('emails', {
        type: 'required',
        message: t('Please enter at least one email address'),
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
          <DialogContent
            className="sm:max-w-[475px]"
            onEscapeKeyDown={(e) => {
              if (suggestionsOpen) {
                e.preventDefault();
                (document.activeElement as HTMLElement)?.blur();
              }
            }}
          >
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
                          value={field.value}
                          onChange={handleEmailsChange}
                          placeholder={t('Invite users by email')}
                          isPlatformPage={isPlatformPage}
                          onOpenChange={setSuggestionsOpen}
                        />
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          {isPlatformPage
                            ? t('Existing users will be skipped if added.')
                            : t('Existing members will be skipped if added.')}
                        </p>
                      </FormItem>
                    )}
                  />

                  {form.getValues().type === InvitationType.PLATFORM && (
                    <PlatformRoleSelect form={form} />
                  )}
                  {form.getValues().type === InvitationType.PROJECT && (
                    <ProjectRoleSelect form={form} />
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
