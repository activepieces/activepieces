import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { projectRoleApi } from '@/features/platform-admin/lib/project-role-api';
import { Permission, ProjectRole, RoleType } from '@activepieces/shared';

const initialPermissions = [
  {
    name: 'Project',
    description: 'Project settings and configuration',
    read: [Permission.READ_PROJECT],
    write: [Permission.READ_PROJECT, Permission.WRITE_PROJECT],
    disableNone: true,
  },
  {
    name: 'Flows',
    description: 'Read and write flows',
    read: [Permission.READ_FLOW],
    write: [Permission.READ_FLOW, Permission.WRITE_FLOW],
    disableNone: true,
  },
  {
    name: 'Flow Status',
    description: 'Update flow status',
    disableRead: true,
    read: [],
    write: [Permission.UPDATE_FLOW_STATUS],
  },
  {
    name: 'App Connections',
    description: 'Read and write app connections',
    read: [Permission.READ_APP_CONNECTION],
    write: [Permission.READ_APP_CONNECTION, Permission.WRITE_APP_CONNECTION],
  },
  {
    name: 'Runs',
    description: 'Read and write runs',
    read: [Permission.READ_RUN],
    write: [Permission.READ_RUN, Permission.WRITE_RUN],
  },
  {
    name: 'Issues',
    description: 'Read and write issues',
    read: [Permission.READ_ISSUES],
    write: [Permission.READ_ISSUES, Permission.WRITE_ISSUES],
  },
  {
    name: 'Folders',
    description: 'Read and write folders',
    read: [Permission.READ_FOLDER],
    write: [Permission.READ_FOLDER, Permission.WRITE_FOLDER],
  },
  {
    name: 'Project Members',
    description: 'Read and write project members',
    read: [Permission.READ_PROJECT_MEMBER],
    write: [Permission.READ_PROJECT_MEMBER, Permission.WRITE_PROJECT_MEMBER],
  },
  {
    name: 'Invitations',
    description: 'Read and write invitations',
    read: [Permission.READ_INVITATION],
    write: [Permission.READ_INVITATION, Permission.WRITE_INVITATION],
  },
  {
    name: 'Project Releases',
    description: 'Read and write project releases',
    read: [Permission.READ_PROJECT_RELEASE],
    write: [Permission.READ_PROJECT_RELEASE, Permission.WRITE_PROJECT_RELEASE],
  },
  {
    name: 'Tables',
    description: 'Read and write tables',
    read: [Permission.READ_TABLE],
    write: [Permission.READ_TABLE, Permission.WRITE_TABLE],
  },
  {
    name: 'Todos',
    description: 'Read and write todos',
    read: [Permission.READ_TODOS],
    write: [Permission.READ_TODOS, Permission.WRITE_TODOS],
  },
  {
    name: 'MCP',
    description: 'Read and write MCP',
    read: [Permission.READ_MCP],
    write: [Permission.READ_MCP, Permission.WRITE_MCP],
  },
];
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
  onSave,
  children,
  disabled = false,
}: ProjectRoleDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roleName, setRoleName] = useState(projectRole?.name || '');
  const [permissions, setPermissions] = useState<string[]>(() => {
    if (!projectRole?.permissions) {
      // Set default Read permissions for any permission with disableNone
      const defaultPermissions = new Set<string>();
      initialPermissions.forEach((permission) => {
        if (permission.disableNone) {
          permission.read.forEach((p) => defaultPermissions.add(p));
        }
      });
      return Array.from(defaultPermissions);
    }
    return projectRole.permissions;
  });
  console.log();

  const { mutate } = useMutation({
    mutationFn: async () => {
      if (mode === 'create') {
        await projectRoleApi.create({
          name: roleName,
          permissions,
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
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Role name already exists',
      });
    },
  });

  const handlePermissionChange = (permission: string, level: string) => {
    const currentPermission = initialPermissions.find(
      (p) => p.name === permission,
    );
    const updatedPermissions = new Set(permissions);

    if (currentPermission?.disableNone) {
      currentPermission.read.forEach((p) => updatedPermissions.delete(p));
      currentPermission.write.forEach((p) => updatedPermissions.delete(p));

      if (level === 'Read') {
        currentPermission.read.forEach((p) => updatedPermissions.add(p));
      } else if (level === 'Write') {
        currentPermission.write.forEach((p) => updatedPermissions.add(p));
      }
    } else {
      if (level === 'None') {
        currentPermission?.read.forEach((p) => updatedPermissions.delete(p));
        currentPermission?.write.forEach((p) => updatedPermissions.delete(p));
      } else if (level === 'Read') {
        currentPermission?.write.forEach((p) => updatedPermissions.delete(p));
        currentPermission?.read.forEach((p) => updatedPermissions.add(p));
      } else if (level === 'Write') {
        currentPermission?.write.forEach((p) => updatedPermissions.add(p));
      }
    }
    setPermissions(Array.from(updatedPermissions));
  };

  const getButtonVariant = (permission: string, level: string) => {
    const currentPermission = initialPermissions.find(
      (p) => p.name === permission,
    );
    const writePermissions = new Set(currentPermission?.write || []);
    const readPermissions = new Set(currentPermission?.read || []);
    const currentPermissionsSet = new Set(permissions);

    const hasWritePermissions =
      writePermissions.size > 0 &&
      [...writePermissions].every((p) => currentPermissionsSet.has(p));

    const hasReadPermissions =
      readPermissions.size > 0 &&
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full max-w-3xl">
        <DialogTitle>
          {mode === 'create'
            ? t('Create New Role')
            : (projectRole?.type === RoleType.DEFAULT
                ? t('View ')
                : t('Edit ')) + projectRole?.name}
        </DialogTitle>
        <div className="grid space-y-4 mt-4">
          <div>
            <span className="text-sm font-medium text-foreground">
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
            <span className="text-sm font-medium text-foreground">
              {t('Permissions')}
            </span>
            <div className="overflow-y-auto p-2 rounded-md">
              <ScrollArea className="h-[70vh] pr-4">
                {initialPermissions.map((permission, index) => (
                  <div
                    key={permission.name}
                    className={`w-full flex flex-col justify-between py-2 ${
                      index !== initialPermissions.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className="w-full flex flex-row justify-between">
                      <span className="font-bold text-foreground">
                        {permission.name}
                      </span>
                      <div className="flex bg-accent rounded-sm space-x-2">
                        {!permission.disableNone && (
                          <Button
                            className="h-9 px-4"
                            variant={getButtonVariant(permission.name, 'None')}
                            onClick={() =>
                              handlePermissionChange(permission.name, 'None')
                            }
                            disabled={disabled}
                          >
                            {t('None')}
                          </Button>
                        )}
                        {!permission.disableRead && (
                          <Button
                            className="h-9 px-4"
                            variant={getButtonVariant(permission.name, 'Read')}
                            onClick={() =>
                              handlePermissionChange(permission.name, 'Read')
                            }
                            disabled={disabled}
                          >
                            {t('Read')}
                          </Button>
                        )}
                        <Button
                          className="h-9 px-4"
                          variant={getButtonVariant(permission.name, 'Write')}
                          onClick={() =>
                            handlePermissionChange(permission.name, 'Write')
                          }
                          disabled={disabled}
                        >
                          {t('Write')}
                        </Button>
                      </div>
                    </div>
                    <span className="text-sm text-accent-foreground">
                      {permission.description}
                    </span>
                  </div>
                ))}
              </ScrollArea>
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
  );
};
