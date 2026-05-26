import { ProjectMemberWithUser } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { internalErrorToast } from '@/components/ui/sonner';
import { projectRoleApi } from '@/features/platform-admin/api/project-role-api';

import { projectMembersApi } from '../api/project-members-api';

import { RoleSelector } from './role-selector';

interface EditRoleDialogProps {
  member: ProjectMemberWithUser;
  onSave: () => void;
  disabled: boolean;
}

export function EditRoleDialog({
  member,
  onSave,
  disabled,
}: EditRoleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member.projectRole.name);
  const { data: rolesData, isPending: rolesLoading } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
  });

  const roles = rolesData?.data ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (newRole: string) => {
      return projectMembersApi.update(member.id, {
        role: newRole,
      });
    },
    onSuccess: (_data, roleName) => {
      toast.success(
        t('{firstName} {lastName} role has become {roleName}', {
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          roleName,
        }),
        {
          duration: 3000,
        },
      );
      onSave();
      setIsOpen(false);
    },
    onError: () => {
      internalErrorToast();
    },
  });

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
  };

  const handleSave = () => {
    mutate(selectedRole);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="size-8 p-0" disabled={disabled}>
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('Edit Role for')} {member.user.firstName} {member.user.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <RoleSelector
            type="project"
            value={selectedRole}
            onValueChange={handleRoleChange}
            roles={roles}
            isLoading={rolesLoading}
            isAssigningRole={isPending}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} loading={isPending}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
