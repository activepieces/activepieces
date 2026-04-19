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
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { TagInput } from '@/components/custom/tag-input';
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
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { HttpError } from '@/lib/api';
import { formatUtils } from '@/lib/format-utils';

import { userInvitationsHooks } from '../../hooks/user-invitations-hooks';

import { UserSuggestionsPopover } from './user-suggestions-popover';

const FormSchema = z.object({
  emails: z
    .array(z.string())
    .min(1, t('Please enter at least one email address')),
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
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tagInputKey, setTagInputKey] = useState(0);
  const inputRef = useRef<HTMLDivElement>(null);
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

  const dialogTitle = hasLinks
    ? t('Invitation Links')
    : isPlatformPage
    ? t('Invite to Your Platform')
    : t('Add Members');

  const dialogDescription = getDialogDescription({
    hasLinks,
    addedMembersCount,
    resultsWithLinksCount: resultsWithLinks.length,
    isPlatformPage,
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
            setInputValue('');
            setShowSuggestions(false);
            setTagInputKey(0);
          }}
        >
          <DialogContent className="sm:max-w-[475px]">
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
  isPlatformPage,
  isSmtpConfigured,
  projectName,
}: {
  hasLinks: boolean;
  addedMembersCount: number;
  resultsWithLinksCount: number;
  isPlatformPage: boolean;
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

  if (isPlatformPage) {
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
        'Existing platform members will be added immediately. New users will receive an invitation email.',
      )
    : t(
        'Existing platform members will be added immediately. New users must use the invitation link.',
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
