import { ProjectRole, RoleType } from '@activepieces/core-utils';
import { t } from 'i18next';
import { MoreHorizontal, Pencil, Trash, Type } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { projectRoleMutations } from '@/features/platform-admin';
import { cn } from '@/lib/utils';

import { PermissionGrid } from './permission-grid';
import { RoleAvatar } from './role-avatar';
import { RolePeopleTab } from './role-people-tab';
import { ROLE_BASES, RoleBase, rolePermissionModel } from './role-permissions';

export const ProjectRoleDialog = ({
  mode,
  projectRole,
  onSave,
  children,
  open,
  onOpenChange,
  initialTab = 'permissions',
}: ProjectRoleDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = open ?? uncontrolledOpen;
  const setIsOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="w-full max-w-4xl gap-0 p-0">
        <RoleDialogBody
          key={isOpen ? `${projectRole?.id ?? 'new'}-open` : 'closed'}
          mode={mode}
          projectRole={projectRole}
          initialTab={initialTab}
          onClose={() => setIsOpen(false)}
          onSaved={() => {
            setIsOpen(false);
            onSave();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

function RoleDialogBody({
  mode,
  projectRole,
  initialTab,
  onClose,
  onSaved,
}: RoleDialogBodyProps) {
  const isCreate = mode === 'create';
  const isBuiltIn = projectRole?.type === RoleType.DEFAULT;

  const [base, setBase] = useState<RoleBase>('Viewer');
  const [name, setName] = useState(projectRole?.name ?? '');
  const [permissions, setPermissions] = useState<string[]>(
    projectRole?.permissions ??
      rolePermissionModel.basePermissions({ base: 'Viewer' }),
  );
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const { mutate: upsertRole, isPending: isSaving } =
    projectRoleMutations.useUpsertProjectRole({ onSave: onSaved });
  const { mutate: deleteRole } = projectRoleMutations.useDeleteProjectRole({
    onSuccess: onSaved,
  });

  const isEditable = isCreate || isEditingPermissions;
  const hasUnsavedIntent = isCreate || isEditingPermissions || isRenaming;
  const granted = rolePermissionModel.grantedBoxes({ permissions });
  const total = rolePermissionModel.totalBoxes();

  const changeBase = (nextBase: RoleBase) => {
    setBase(nextBase);
    setPermissions(rolePermissionModel.basePermissions({ base: nextBase }));
  };

  const submit = () => {
    upsertRole({
      mode,
      roleId: projectRole?.id,
      name,
      permissions,
      type: RoleType.CUSTOM,
    });
  };

  return (
    <>
      <div className="flex items-start gap-3 border-b px-6 py-4">
        {!isCreate && projectRole && <RoleAvatar name={projectRole.name} />}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {isCreate && (
            <p className="text-xss font-medium uppercase tracking-wider text-muted-foreground">
              {t('New role')}
            </p>
          )}
          {isCreate || isRenaming ? (
            <>
              <DialogTitle className="sr-only">
                {isCreate ? t('New role') : t('Rename')}
              </DialogTitle>
              <Input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('Role name')}
                className="max-w-sm"
              />
            </>
          ) : (
            <DialogTitle className="flex items-center gap-2 text-lg">
              {projectRole?.name}
              <Badge
                variant={isBuiltIn ? 'accent' : 'inverted'}
                className="text-xss uppercase tracking-wider"
              >
                {isBuiltIn ? t('Built in') : t('Custom')}
              </Badge>
            </DialogTitle>
          )}
          <DialogDescription className={cn('text-sm', !isBuiltIn && 'sr-only')}>
            {isBuiltIn
              ? t("Built-in roles can't be changed")
              : t(
                  'Every permission is listed; tick to add, untick to take away.',
                )}
          </DialogDescription>
        </div>
        {!isCreate && !isBuiltIn && projectRole && (
          <div className="flex shrink-0 items-center gap-2">
            {!isEditingPermissions && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingPermissions(true)}
              >
                <Pencil className="size-4" />
                {t('Edit')}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">{t('More')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => setIsEditingPermissions(true)}
                >
                  <Pencil className="size-4" />
                  {t('Edit permissions')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsRenaming(true)}>
                  <Type className="size-4" />
                  {t('Rename')}
                </DropdownMenuItem>
                <ConfirmationDeleteDialog
                  isDanger={true}
                  title={t('Delete role')}
                  message={t(
                    'Deleting this role will remove {count} project member(s) and all associated invitations.',
                    { count: projectRole.userCount },
                  )}
                  entityName={`${t('Project Role')} ${projectRole.name}`}
                  buttonText={t('Delete role')}
                  mutationFn={async () => deleteRole(projectRole.name)}
                >
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <Trash className="size-4" />
                    {t('Delete role')}
                  </DropdownMenuItem>
                </ConfirmationDeleteDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {isCreate ? (
        <div className="flex flex-col gap-4 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {t('Based on')}
              </span>
              <div className="inline-flex items-center rounded-md bg-muted p-1">
                {ROLE_BASES.map((roleBase) => (
                  <Button
                    key={roleBase}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'h-7 rounded-sm px-3 text-muted-foreground',
                      base === roleBase &&
                        'bg-background text-foreground shadow-xs hover:bg-background',
                    )}
                    onClick={() => changeBase(roleBase)}
                  >
                    {t(roleBase)}
                  </Button>
                ))}
              </div>
            </div>
            <GrantedCounter granted={granted} total={total} />
          </div>
          <ScrollArea className="max-h-[52vh] pr-4">
            <PermissionGrid
              permissions={permissions}
              readOnly={false}
              changedRowKeys={rolePermissionModel.changedRowKeys({
                permissions,
                base,
              })}
              onPermissionsChange={setPermissions}
            />
          </ScrollArea>
        </div>
      ) : (
        <Tabs defaultValue={initialTab} className="px-6 pb-2">
          <TabsList variant="outline" className="border-b w-full justify-start">
            <TabsTrigger variant="outline" value="permissions">
              {t('Permissions')}
            </TabsTrigger>
            <TabsTrigger variant="outline" value="people" className="gap-2">
              {t('People')}
              <span className="text-muted-foreground">
                {projectRole?.userCount ?? 0}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="permissions" className="flex flex-col gap-3">
            <div className="flex justify-end">
              <GrantedCounter granted={granted} total={total} />
            </div>
            <ScrollArea className="max-h-[52vh] pr-4">
              <PermissionGrid
                permissions={permissions}
                readOnly={!isEditable}
                onPermissionsChange={setPermissions}
              />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="people">
            {projectRole && <RolePeopleTab projectRole={projectRole} />}
          </TabsContent>
        </Tabs>
      )}

      {hasUnsavedIntent && (
        <div className="flex items-center justify-end gap-2 border-t px-6 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            disabled={name.trim().length === 0 || isSaving}
            onClick={submit}
          >
            {isCreate ? t('Create role') : t('Save changes')}
          </Button>
        </div>
      )}
    </>
  );
}

function GrantedCounter({ granted, total }: GrantedCounterProps) {
  return (
    <span className="text-sm text-muted-foreground">
      {t('grantedCount', { granted, total })}
    </span>
  );
}

type GrantedCounterProps = {
  granted: number;
  total: number;
};

type RoleDialogTab = 'permissions' | 'people';

type RoleDialogBodyProps = {
  mode: 'create' | 'edit';
  projectRole?: ProjectRole;
  initialTab: RoleDialogTab;
  onClose: () => void;
  onSaved: () => void;
};

type ProjectRoleDialogProps = {
  mode: 'create' | 'edit';
  projectRole?: ProjectRole;
  platformId: string;
  onSave: () => void;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialTab?: RoleDialogTab;
};
