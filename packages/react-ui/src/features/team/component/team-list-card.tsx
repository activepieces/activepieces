import { useQuery } from '@tanstack/react-query';
import { Trash, Plus, ChevronDownIcon } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/seperator';
import { authenticationSession } from '@/lib/authentication-session';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';

import { projectMembersApi } from '../lib/project-members-api';

const fetchData = async () => {
  const apiResult = await projectMembersApi.list({
    projectId: authenticationSession.getProjectId(),
    cursor: undefined,
    limit: 100,
  });
  return apiResult.data;
};

export default function TeamCardList() {
  const { data, isLoading, isError } = useQuery<
    ProjectMemberWithUser[],
    Error,
    ProjectMemberWithUser[]
  >({
    queryKey: ['team-card-list'],
    queryFn: fetchData,
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Project Members</CardTitle>
        <CardDescription>
          Invite your team members to collaborate.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 ">
        <div className="flex min-h-[35px] flex-col gap-4">
          {isLoading && <div>Loading...</div>}
          {data && data.length === 0 && (
            <div className="text-center">
              No members are added to this project.
            </div>
          )}
          {isError && <div>Error, please try again.</div>}
          {Array.isArray(data) &&
            data.map((member: ProjectMemberWithUser) => (
              <div
                className="flex items-center justify-between space-x-4"
                key={member.id}
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="hidden size-9 sm:flex">
                    <AvatarImage src="/avatars/05.png" alt="Avatar" />
                    <AvatarFallback>
                      {member.user.firstName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="ml-auto">
                        Member{' '}
                        <ChevronDownIcon className="ml-2 size-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Select new role..." />
                        <CommandList>
                          <CommandEmpty>No roles found.</CommandEmpty>
                          <CommandGroup className="p-1.5">
                            <CommandItem className="flex flex-col items-start px-4 py-2">
                              <p>Viewer</p>
                              <p className="text-sm text-muted-foreground">
                                Can view and comment.
                              </p>
                            </CommandItem>
                            <CommandItem className="flex flex-col items-start px-4 py-2">
                              <p>Developer</p>
                              <p className="text-sm text-muted-foreground">
                                Can view, comment and edit.
                              </p>
                            </CommandItem>
                            <CommandItem className="flex flex-col items-start px-4 py-2">
                              <p>Billing</p>
                              <p className="text-sm text-muted-foreground">
                                Can view, comment and manage billing.
                              </p>
                            </CommandItem>
                            <CommandItem className="flex flex-col items-start px-4 py-2">
                              <p>Owner</p>
                              <p className="text-sm text-muted-foreground">
                                Admin-level access to all resources.
                              </p>
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <ConfirmationDeleteDialog
                    onClose={() => {}}
                    onConfirm={() => {}}
                    title={`Remove ${member.user.firstName} ${member.user.lastName}`}
                    message="Are you sure you want to remove this member?"
                  >
                    <Button variant="ghost" className="size-8 p-0">
                      <Trash className="bg-destructive-500 size-4" />
                    </Button>
                  </ConfirmationDeleteDialog>
                </div>
              </div>
            ))}
          <Separator />
          <div className="text-2xl font-bold tracking-tight">
            Pending Invitations
          </div>
        </div>
        <Button variant="outline" className="mt-4 flex items-center space-x-2">
          <Plus className="size-4" />
          <span>Invite User</span>
        </Button>
      </CardContent>
    </Card>
  );
}
