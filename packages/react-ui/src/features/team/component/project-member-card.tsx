import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { Permission } from '@activepieces/shared';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { PopoverContent } from '@radix-ui/react-popover';
import { ChevronDownIcon, Trash } from 'lucide-react';

import { ConfirmationDeleteDialog } from '../../../components/delete-dialog';
import { Avatar, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../../components/ui/command';
import { Popover, PopoverTrigger } from '../../../components/ui/popover';
import { projectMembersApi } from '../lib/project-members-api';
import { projectMembersHooks } from '../lib/project-members-hooks';

import { Authorization } from '@/components/authorization';

export function ProjectMemberCard({
  member,
}: {
  member: ProjectMemberWithUser;
}) {
  const { refetch } = projectMembersHooks.useProjectMembers();

  async function deleteMember() {
    await projectMembersApi.delete(member.id);
    refetch();
  }

  return (
    <div
      className="flex items-center justify-between space-x-4"
      key={member.id}
    >
      <div className="flex items-center space-x-4">
        <Avatar className="hidden size-9 sm:flex">
          <AvatarImage src="/avatars/05.png" alt="Avatar" />
          <AvatarFallback className="justify-center items-center flex">
            <span className="p-2">
              {member.user.email.charAt(0).toLocaleUpperCase()}
            </span>
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">
            {member.user.firstName} {member.user.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{member.user.email}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              Member
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
        <Authorization permission={Permission.WRITE_INVITATION}>
          <ConfirmationDeleteDialog
            title={`Remove ${member.user.firstName} ${member.user.lastName}`}
            message="Are you sure you want to remove this member?"
            mutationFn={() => deleteMember()}
            entityName={`${member.user.firstName} ${member.user.lastName}`}
          >
            <Button variant="ghost" className="size-8 p-0">
              <Trash className="bg-destructive-500 size-4" />
            </Button>
          </ConfirmationDeleteDialog>
        </Authorization>
      </div>
    </div>
  );
}
