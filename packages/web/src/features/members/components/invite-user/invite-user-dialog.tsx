import {
  ApFlagId,
  InvitationStatus,
  InvitationType,
  Permission,
  PlatformRole,
  ProjectType,
  UserInvitationWithLink,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { CopyIcon, DownloadIcon } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import { PlatformRoleSelect } from '@/features/members/components/platform-role-select';
import { ProjectRoleSelect } from '@/features/members/components/project-role-select';
import { projectMembersHooks } from '@/features/members/hooks/project-members-hooks';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
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
      code: 'custom',
      message: buildInvalidEmailsMessage(invalidEmails),
    });
  }),
  type: z.enum(InvitationType, {
    message: t('Please select invitation type'),
  }),
  platformRole: z.enum(PlatformRole, {
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
  const [invitationResults, setInvitationResults] = useState<
    UserInvitationWithLink[]
  >([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: isSmtpConfigured } = flagsHooks.useFlag<boolean>(
    ApFlagId.SMTP_CONFIGURED,
  );
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

  const resultsWithLinks = invitationResults.filter((r) => r.link);
  const hasLinks = resultsWithLinks.length > 0;
  const addedMembersCount = invitationResults.filter(
    (r) => r.status === InvitationStatus.ACCEPTED,
  ).length;

  const { mutate, isPending } = useMutation<
    UserInvitationWithLink[],
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

      return Promise.all(promises);
    },
    onSuccess: (results) => {
      const addedCount = results.filter(
        (r) => r.status === InvitationStatus.ACCEPTED,
      ).length;
      const invitedCount = results.filter((r) => r.link).length;

      if (invitedCount > 0) {
        setInvitationResults(results);
      } else {
        setOpen(false);
        form.reset();
      }

      const toastMessage = buildInviteToast({
        addedCount,
        invitedCount,
        sentCount: results.length - addedCount - invitedCount,
        projectName: project.displayName,
      });
      if (toastMessage) {
        toast.success(toastMessage, { duration: 3000 });
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
      platformRole: PlatformRole.OPERATOR,
      projectRole: undefined,
    },
  });

  const invitationType = form.getValues().type;
  const isPlatformInvite = invitationType === InvitationType.PLATFORM;

  const handleEmailsChange = useCallback(
    (emails: ReadonlyArray<string>) => {
      const filtered = emails.filter((e) => {
        const lower = e.toLowerCase();
        if (isPlatformInvite) return !platformUserEmails.has(lower);
        return !projectMemberEmails.has(lower);
      });
      form.setValue('emails', [...filtered]);
      form.trigger('emails');
    },
    [form, isPlatformInvite, platformUserEmails, projectMemberEmails],
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

  const copyAllLinks = () => {
    const text = resultsWithLinks
      .map((r) => `${r.email}: ${r.link}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success(t('All invitation links copied successfully'), {
      duration: 3000,
    });
  };

  const downloadCsv = () => {
    const rows = [
      'email,invitation_link',
      ...resultsWithLinks.map(
        (r) => `${escapeCsvField(r.email)},${escapeCsvField(r.link!)}`,
      ),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invitations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (embedState.isEmbedded || !userHasPermissionToInviteUser) {
    return null;
  }

  const dialogTitle = hasLinks
    ? t('Invitation Links')
    : isPlatformInvite
    ? t('Invite to platform')
    : t('Add Members');

  const dialogDescription = getDialogDescription({
    hasLinks,
    addedMembersCount,
    resultsWithLinksCount: resultsWithLinks.length,
    invitationType,
    isSmtpConfigured: isSmtpConfigured ?? false,
    projectName: project.displayName,
  });

  return (
    <>
      {
        <Dialog
          open={open}
          modal
          onOpenChange={(open) => {
            setOpen(open);
            form.reset();
            setInvitationResults([]);
            setSuggestionsOpen(false);
          }}
        >
          <DialogContent
            className="sm:max-w-[475px]"
            onEscapeKeyDown={(e) => {
              if (suggestionsOpen) e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>

            {!hasLinks ? (
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
                          invitationType={invitationType}
                          onOpenChange={setSuggestionsOpen}
                        />
                        <FormMessage />
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
                      {isPlatformInvite ? t('Invite') : t('Add')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            ) : (
              <div className="flex flex-col gap-3">
                <ScrollArea className="max-h-[300px]">
                  <div className="flex flex-col gap-3">
                    {resultsWithLinks.map((result) => (
                      <div key={result.id} className="flex flex-col gap-1">
                        <Label className="text-sm">{result.email}</Label>
                        <CopyToClipboardInput
                          useInput={true}
                          textToCopy={result.link!}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {resultsWithLinks.length > 1 && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={copyAllLinks}
                    >
                      <CopyIcon height={15} width={15} />
                      {t('Copy All')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={downloadCsv}
                    >
                      <DownloadIcon height={15} width={15} />
                      {t('Download CSV')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      }
    </>
  );
};

function getDialogDescription({
  hasLinks,
  addedMembersCount,
  resultsWithLinksCount,
  invitationType,
  isSmtpConfigured,
  projectName,
}: {
  hasLinks: boolean;
  addedMembersCount: number;
  resultsWithLinksCount: number;
  invitationType: InvitationType;
  isSmtpConfigured: boolean;
  projectName: string;
}): string {
  if (hasLinks) {
    const addedPrefix =
      addedMembersCount > 0
        ? t('membersAddedImmediately', {
            count: addedMembersCount,
            projectName,
          }) + ' '
        : '';
    const linkText =
      resultsWithLinksCount === 1
        ? t(
            'Please copy the link below and share it with the user you want to invite. The invitation expires in 7 days.',
          )
        : t(
            'Please copy the links below and share them with the users you want to invite. The invitations expire in 7 days.',
          );
    return addedPrefix + linkText;
  }

  if (invitationType === InvitationType.PLATFORM) {
    const base = t(
      'Invite team members to collaborate and build amazing flows together.',
    );
    return isSmtpConfigured
      ? base
      : base +
          ' ' +
          t(
            'Invitations will be shared via link since email is not configured.',
          );
  }

  return isSmtpConfigured
    ? t(
        'Platform members get instant access. New users will receive an invitation email.',
      )
    : t(
        'Platform members get instant access. New users will need to visit the invitation link.',
      );
}

function buildInviteToast({
  addedCount,
  invitedCount,
  sentCount,
  projectName,
}: {
  addedCount: number;
  invitedCount: number;
  sentCount: number;
  projectName: string;
}): React.ReactNode | null {
  const lines: string[] = [];
  if (addedCount > 0) {
    lines.push(t('membersAddedCount', { count: addedCount, projectName }));
  }
  if (invitedCount > 0) {
    lines.push(t('invitationsLinkCount', { count: invitedCount }));
  }
  if (sentCount > 0) {
    lines.push(t('invitationsSentCount', { count: sentCount }));
  }
  if (lines.length === 0) {
    return null;
  }
  return (
    <span>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </span>
  );
}
const escapeCsvField = (value: string) => `"${value.replace(/"/g, '""')}"`;
