import { ErrorCode, ProjectRole, RoleType } from '@activepieces/core-utils';
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
import { roleCopy } from '@/features/members/lib/role-copy';
import { projectRoleMutations } from '@/features/platform-admin';
import { api } from '@/lib/api';
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
      <DialogContent className="@container flex h-[min(36rem,88dvh)] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
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
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [tab, setTab] = useState<RoleDialogTab>(initialTab);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { mutate: upsertRole, isPending: isSaving } =
    projectRoleMutations.useUpsertProjectRole({
      onSave: onSaved,
      onError: (error) =>
        setSaveError(
          isCreate && api.isApError(error, ErrorCode.ENTITY_NOT_FOUND)
            ? t('A role with this name already exists.')
            : t('Could not save the role. Try again.'),
        ),
    });
  const { mutateAsync: deleteRole } = projectRoleMutations.useDeleteProjectRole(
    {
      onSuccess: onSaved,
    },
  );

  const granted = rolePermissionModel.grantedBoxes({ permissions });
  const total = rolePermissionModel.totalBoxes();
  const showsActions =
    isCreate || isRenaming || (isEditingPermissions && tab === 'permissions');
  const isDirty =
    name.trim() !== projectRole?.name ||
    !samePermissions(permissions, projectRole?.permissions ?? []);
  const canSubmit =
    name.trim().length > 0 && !isSaving && (isCreate || isDirty);

  const changeBase = (nextBase: RoleBase) => {
    setBase(nextBase);
    setPermissions(rolePermissionModel.basePermissions({ base: nextBase }));
  };

  const submit = () => {
    setSaveError(null);
    upsertRole({
      mode,
      roleId: projectRole?.id,
      name: name.trim(),
      permissions,
      type: RoleType.CUSTOM,
    });
  };

  const counter = (
    <span className="hidden shrink-0 text-sm tabular-nums text-muted-foreground @min-[24rem]:inline">
      {t('grantedCount', { granted, total })}
    </span>
  );

  return (
    <>
      <header className="flex shrink-0 items-center gap-3 border-b py-4 pr-12 pl-6">
        {!isCreate && projectRole && (
          <RoleAvatar
            name={projectRole.name}
            tone={roleCopy.projectRoleTone(projectRole.name)}
          />
        )}
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
                onChange={(event) => {
                  setName(event.target.value);
                  setSaveError(null);
                }}
                placeholder={t('Role name')}
                className="h-9 max-w-xs"
              />
            </>
          ) : (
            <DialogTitle className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-lg">
              <span className="truncate">{projectRole?.name}</span>
              <Badge
                variant={isBuiltIn ? 'accent' : 'inverted'}
                className="shrink-0 text-xss uppercase tracking-wider"
              >
                {isBuiltIn ? t('Built in') : t('Custom')}
              </Badge>
            </DialogTitle>
          )}
          <DialogDescription className={cn('text-sm', !isBuiltIn && 'sr-only')}>
            {isBuiltIn
              ? t("Built-in roles can't be changed")
              : t('Tick to add a permission, untick to take it away.')}
          </DialogDescription>
        </div>
        {!isCreate && !isBuiltIn && projectRole && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="size-8 shrink-0 p-0">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{t('More')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setIsEditingPermissions(true);
                  setTab('permissions');
                }}
                disabled={isEditingPermissions}
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
                onError={() =>
                  setSaveError(t('Could not delete the role. Try again.'))
                }
                mutationFn={async () => {
                  await deleteRole(projectRole.name);
                }}
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
        )}
      </header>

      {isCreate ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-3">
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
            {counter}
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-6 pb-4">
              <PermissionGrid
                permissions={permissions}
                readOnly={false}
                changedRowKeys={rolePermissionModel.changedRowKeys({
                  permissions,
                  base,
                })}
                onPermissionsChange={setPermissions}
              />
            </div>
          </ScrollArea>
        </div>
      ) : (
        <Tabs
          value={tab}
          onValueChange={(value) =>
            setTab(value === 'people' ? 'people' : 'permissions')
          }
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b px-6">
            <TabsList variant="outline" className="gap-6">
              <TabsTrigger
                variant="outline"
                value="permissions"
                className="px-0 py-3"
              >
                {t('Permissions')}
              </TabsTrigger>
              <TabsTrigger
                variant="outline"
                value="people"
                className="gap-2 px-0 py-3"
              >
                {t('People')}
                <span className="tabular-nums text-muted-foreground">
                  {projectRole?.userCount ?? 0}
                </span>
              </TabsTrigger>
            </TabsList>
            {tab === 'permissions' && counter}
          </div>
          <TabsContent
            value="permissions"
            className="mt-0 flex min-h-0 flex-1 flex-col"
          >
            <ScrollArea className="min-h-0 flex-1">
              <div className="px-6 pt-4 pb-4">
                <PermissionGrid
                  permissions={permissions}
                  readOnly={!isEditingPermissions}
                  onPermissionsChange={setPermissions}
                />
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="people" className="mt-0 min-h-0 flex-1">
            {projectRole && <RolePeopleTab projectRole={projectRole} />}
          </TabsContent>
        </Tabs>
      )}

      <footer className="flex shrink-0 flex-wrap items-center justify-end gap-x-6 gap-y-2 border-t px-6 py-3">
        <p
          role={saveError ? 'alert' : undefined}
          className={cn(
            'min-w-0 basis-full text-xs sm:flex-1 sm:basis-auto',
            saveError
              ? 'font-medium text-destructive'
              : 'text-muted-foreground',
          )}
        >
          {saveError ??
            (!isCreate && tab === 'people'
              ? t(
                  "A role is set per project, so the same person can have a different role elsewhere. To change someone's role, open that project.",
                )
              : t(
                  'Flow status has no view-only level, so it has no View box.',
                ))}
        </p>
        {showsActions && (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button type="button" disabled={!canSubmit} onClick={submit}>
              {isCreate ? t('Create role') : t('Save changes')}
            </Button>
          </div>
        )}
      </footer>
    </>
  );
}

function samePermissions(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((permission) => rightSet.has(permission));
}

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
  onSave: () => void;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialTab?: RoleDialogTab;
};
