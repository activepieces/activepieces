import {
  ApFlagId,
  InvitationType,
  PlatformRole,
  ProjectMemberRole,
  SendUserInvitationRequest,
  UserInvitationWithLink,
} from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { TooltipContent } from '@radix-ui/react-tooltip';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { CopyIcon, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  FormField,
  FormItem,
  Form,
  FormMessage,
} from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tooltip, TooltipTrigger } from '../../components/ui/tooltip';
import { toast } from '../../components/ui/use-toast';
import { userInvitiationApi } from '../../features/team/lib/user-invitiation-api';
import { flagsHooks } from '../../hooks/flags-hooks';
import { platformHooks } from '../../hooks/platform-hooks';
import { projectHooks } from '../../hooks/project-hooks';
import { HttpError } from '../../lib/api';
import { authenticationSession } from '../../lib/authentication-session';
import { flagsApi } from '../../lib/flags-api';
import { RolesDisplayNames } from '../../lib/platforms-api';
import { formatUtils } from '../../lib/utils';

const FormSchema = Type.Object({
  email: Type.String({
    errorMessage: 'Please enter a valid email address',
    pattern: formatUtils.EMAIL_REGEX,
  }),
  type: Type.Enum(InvitationType, {
    errorMessage: 'Please select invitation type',
    required: true,
  }),
  platformRole: Type.Enum(PlatformRole, {
    errorMessage: 'Please select platform role',
    required: true,
  }),
  projectRole: Type.Enum(ProjectMemberRole, {
    errorMessage: 'Please select project role',
    required: true,
  }),
});

type FormSchema = Static<typeof FormSchema>;

export function InviteUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const { data: platform } = platformHooks.useCurrentPlatform();
  const { data: flags } = flagsHooks.useFlags();
  const { data: project } = projectHooks.useCurrentProject();
  const isCloudPlatform = flagsApi.isFlagEnabled(
    flags,
    ApFlagId.IS_CLOUD_PLATFORM
  );
  const currentUser = authenticationSession.getCurrentUser();
  const invitationRoles = Object.values(ProjectMemberRole)
    .filter((f) => {
      if (f === ProjectMemberRole.ADMIN) {
        return true;
      }
      const showNonAdmin =
        !isCloudPlatform || project?.plan.teamMembers !== 100;
      return showNonAdmin;
    })
    .map((role) => {
      return {
        value: role,
        name: RolesDisplayNames[role],
      };
    })
    .map((r) => {
      return (
        <SelectItem key={r.value} value={r.value}>
          {r.name}
        </SelectItem>
      );
    });
  const { mutate, isPending } = useMutation<
    UserInvitationWithLink,
    HttpError,
    SendUserInvitationRequest
  >({
    mutationFn: userInvitiationApi.invite,
    onSuccess: (res) => {
      console.log(res);
      if (res.link) {
        setInvitationLink(res.link);
      } else {
        setIsOpen(false);
        toast({
          title: 'Invitation sent successfully',
        });
      }
      //TODO: navigate to platform admin users
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const form = useForm<FormSchema>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {
      email: '',
      type: platform.manageProjectsEnabled
        ? InvitationType.PROJECT
        : InvitationType.PLATFORM,
      platformRole: PlatformRole.ADMIN,
      projectRole: ProjectMemberRole.ADMIN,
    },
  });
  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast({
      title: 'Invitation link copied successfully',
    });
  };
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={'outline'}
          size="sm"
          className="flex items-center justify-center gap-2"
        >
          <Plus className="size-4" />
          <span>Invite User</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {invitationLink ? 'Invitation Link' : 'Invite User'}
          </DialogTitle>
          <DialogDescription>
            {invitationLink
              ? `Please copy the link below and share it with the user you want
                to invite, the invitation expires in 24 hours.`
              : `Type the email address of the user you want to invite, the
                invitation expires in 24 hours.
           `}
          </DialogDescription>
        </DialogHeader>

        {!invitationLink ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                (data) => {
                  const request: SendUserInvitationRequest = {
                    email: data.email,
                    type: data.type,
                    platformRole: data.platformRole,
                    projectId:
                      data.type === InvitationType.PLATFORM ? null : project.id,
                    projectRole:
                      data.type === InvitationType.PLATFORM
                        ? undefined
                        : data.projectRole,
                  };
                  mutate(request);
                },
                () => {
                  console.log(form.formState.errors);
                }
              )}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input {...field} type="text" placeholder="jon@doe.com" />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="grid gap-3">
                    <Label>Invite To</Label>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Invite To" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Invite To</SelectLabel>
                          {currentUser?.platformRole === PlatformRole.ADMIN && (
                            <SelectItem value={InvitationType.PLATFORM}>
                              Entire Platform
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
                <FormField
                  control={form.control}
                  name="platformRole"
                  render={({ field }) => (
                    <FormItem className="grid gap-3">
                      <Label>Platform Role</Label>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a platform role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Platform Role</SelectLabel>
                            <SelectItem value={PlatformRole.ADMIN}>
                              Admin
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
              )}
              {form.getValues().type === InvitationType.PROJECT && (
                <FormField
                  control={form.control}
                  name="projectRole"
                  render={({ field }) => (
                    <FormItem className="grid gap-3">
                      <Label>Project Role</Label>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Project Role</SelectLabel>
                            {invitationRoles}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                ></FormField>
              )}

              {form?.formState?.errors?.root?.serverError && (
                <FormMessage>
                  {form.formState.errors.root.serverError.message}
                </FormMessage>
              )}
              <DialogFooter>
                <Button type="submit" loading={isPending}>
                  Invite
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <>
            <Label htmlFor="invitationLink" className="mb-2">
              Invitation Link
            </Label>
            <div className="flex">
              <Input
                name="invitationLink"
                type="text"
                readOnly={true}
                defaultValue={invitationLink}
                placeholder="Invitation Link"
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
                    className=" rounded-l-none rounded-r-md"
                    onClick={copyInvitationLink}
                  >
                    <CopyIcon height={15} width={15}></CopyIcon>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
