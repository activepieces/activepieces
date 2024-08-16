import { AvatarFallback } from '@radix-ui/react-avatar';
import { PopoverContent } from '@radix-ui/react-popover';
import { t } from 'i18next';
import { ChevronDownIcon, Trash } from 'lucide-react';

import { Authorization } from '@/components/authorization';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { Permission } from '@activepieces/shared';

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
              {t('Member')}
              <ChevronDownIcon className="ml-2 size-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="end">
            <Command>
              <CommandInput placeholder={t('Select new role...')} />
              <CommandList>
                <CommandEmpty>{t('No roles found.')}</CommandEmpty>
                <CommandGroup className="p-1.5">
                  <CommandItem className="flex flex-col items-start px-4 py-2">
                    <p>{t('Viewer')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('Can view and comment.')}
                    </p>
                  </CommandItem>
                  <CommandItem className="flex flex-col items-start px-4 py-2">
                    <p>{t('Developer')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('Can view, comment and edit.')}
                    </p>
                  </CommandItem>
                  <CommandItem className="flex flex-col items-start px-4 py-2">
                    <p>{t('Billing')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('Can view, comment and manage billing.')}
                    </p>
                  </CommandItem>
                  <CommandItem className="flex flex-col items-start px-4 py-2">
                    <p>{t('Owner')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('Admin-level access to all resources.')}
                    </p>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Authorization
          permission={Permission.WRITE_INVITATION}
          forbiddenFallback={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button disabled variant="ghost" className="size-8 p-0">
                    <Trash className="bg-destructive-500 size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{t('Permission Needed')}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        >
          <ConfirmationDeleteDialog
            title={`${t('Remove')} ${member.user.firstName} ${
              member.user.lastName
            }`}
            message={t('Are you sure you want to remove this member?')}
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
