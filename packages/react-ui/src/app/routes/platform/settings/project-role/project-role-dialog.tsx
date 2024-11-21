import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { projectRoleApi } from '@/features/platform-admin-panel/lib/project-role-api';
import { ProjectRole, RoleType } from '@activepieces/shared';

import { InitialPermissions } from './index';

interface ProjectRoleDialogProps {
  mode: 'create' | 'edit';
  projectRole?: ProjectRole;
  platformId: string;
  onSave: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export const ProjectRoleDialog = ({
  mode,
  projectRole,
  platformId,
  onSave,
  children,
  disabled = false,
}: ProjectRoleDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roleName, setRoleName] = useState(projectRole?.name || '');
  const [permissions, setPermissions] = useState<string[]>(
    projectRole?.permissions || [],
  );

  const { mutate } = useMutation({
    mutationFn: async () => {
      if (mode === 'create') {
        await projectRoleApi.create({
          name: roleName,
          permissions,
          platformId,
          type: RoleType.CUSTOM,
        });
      } else if (mode === 'edit' && projectRole) {
        await projectRoleApi.update(projectRole.id, {
          name: roleName,
          permissions,
        });
      }
    },
    onSuccess: () => {
      setIsOpen(false);
      onSave();
    },
  });

  const handlePermissionChange = (permission: string, level: string) => {
    const currentPermission = InitialPermissions.find(
      (p) => p.name === permission,
    );
    const updatedPermissions = new Set(permissions);

    if (level === 'None') {
      currentPermission?.read.forEach((p) => updatedPermissions.delete(p));
      currentPermission?.write.forEach((p) => updatedPermissions.delete(p));
    } else if (level === 'Read') {
      currentPermission?.write.forEach((p) => updatedPermissions.delete(p));
      currentPermission?.read.forEach((p) => updatedPermissions.add(p));
    } else if (level === 'Write') {
      currentPermission?.write.forEach((p) => updatedPermissions.add(p));
    }

    setPermissions(Array.from(updatedPermissions));
  };

  const getButtonVariant = (permission: string, level: string) => {
    const currentPermission = InitialPermissions.find(
      (p) => p.name === permission,
    );
    const writePermissions = new Set(currentPermission?.write || []);
    const readPermissions = new Set(currentPermission?.read || []);
    const currentPermissionsSet = new Set(permissions);

    const hasWritePermissions = [...writePermissions].every((p) =>
      currentPermissionsSet.has(p),
    );
    const hasReadPermissions =
      [...readPermissions].every((p) => currentPermissionsSet.has(p)) &&
      !hasWritePermissions;

    if (level === 'Write' && hasWritePermissions) {
      return 'default';
    } else if (level === 'Read' && hasReadPermissions) {
      return 'default';
    } else if (
      level === 'None' &&
      !hasReadPermissions &&
      !hasWritePermissions
    ) {
      return 'default';
    }
    return 'ghost';
  };

  const handleSubmit = () => {
    if (!disabled) {
      mutate();
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        className="size-8 p-0"
        onClick={() => setIsOpen(true)}
        disabled={false}
      >
        {children}
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-2xl">
          <DialogTitle>
            {mode === 'create'
              ? t('Create New Role')
              : (projectRole?.type === RoleType.DEFAULT
                  ? t('View ')
                  : t('Edit ')) + projectRole?.name}
          </DialogTitle>
          <div className="grid space-y-4 mt-4">
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t('Name')}
              </span>
              <Input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
                id="name"
                type="text"
                placeholder={t('Role Name')}
                className="rounded-sm mt-2"
                disabled={disabled}
              />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t('Permissions')}
              </span>
              <div className="overflow-y-auto p-2 rounded-md">
                {InitialPermissions.map((permission, index) => (
                  <div
                    key={permission.name}
                    className={`w-full flex flex-col justify-between py-2 ${
                      index !== InitialPermissions.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className="w-full flex flex-row justify-between">
                      <span className="font-bold text-gray-700">
                        {permission.name}
                      </span>
                      <div className="flex bg-gray-100 rounded-sm space-x-2">
                        <Button
                          className="h-9 px-4"
                          variant={getButtonVariant(permission.name, 'None')}
                          onClick={() =>
                            handlePermissionChange(permission.name, 'None')
                          }
                          disabled={disabled}
                        >
                          None
                        </Button>
                        <Button
                          className="h-9 px-4"
                          variant={getButtonVariant(permission.name, 'Read')}
                          onClick={() =>
                            handlePermissionChange(permission.name, 'Read')
                          }
                          disabled={disabled}
                        >
                          Read
                        </Button>
                        <Button
                          className="h-9 px-4"
                          variant={getButtonVariant(permission.name, 'Write')}
                          onClick={() =>
                            handlePermissionChange(permission.name, 'Write')
                          }
                          disabled={disabled}
                        >
                          Write
                        </Button>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {permission.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {!disabled && (
              <Button onClick={handleSubmit}>
                {mode === 'create' ? t('Create') : t('Save')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
