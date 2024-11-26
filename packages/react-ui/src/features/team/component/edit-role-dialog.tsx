import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { projectRoleApi } from '@/features/platform-admin-panel/lib/project-role-api';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';

import { projectMembersApi } from '../lib/project-members-api';

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
  const { data: rolesData } = useQuery({
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
    onSuccess: () => {
      toast({
        title: t('Role updated successfully'),
      });
      onSave();
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: t('Error updating role'),
        description: t('Please try again later'),
      });
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
          <Select onValueChange={handleRoleChange} defaultValue={selectedRole}>
            <SelectTrigger>
              <SelectValue placeholder={t('Select Role')} />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.name} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
