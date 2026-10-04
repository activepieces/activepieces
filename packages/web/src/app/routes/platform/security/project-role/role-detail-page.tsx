import { ErrorCode, ProjectRole, RoleType } from '@activepieces/core-utils';
import { ProjectMemberWithUser } from '@activepieces/shared';
import { t } from 'i18next';
import { Copy, Shield } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { InitialsTile, NameCell } from '@/components/custom/list/list-cells';
import { Page, PageColumns, PageHeader } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { DangerZone, SaveBar } from '@/components/custom/settings-parts';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { roleCopy } from '@/features/members/lib/role-copy';
import {
  PermissionGrant,
  PermissionRow,
  rolePermissionModel,
} from '@/features/members/lib/role-permissions';
import {
  projectRoleMutations,
  projectRoleQueries,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { DeleteRoleDialog } from './delete-role-dialog';
import { NewRoleDialog } from './new-role-dialog';
import { LockedRoleButton } from './role-lock';

export function RoleDetailPage() {
  const { roleId } = useParams();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data, isLoading, isError, refetch } =
    projectRoleQueries.useProjectRoles(platform.plan.projectRolesEnabled);
  const role = data?.data.find((candidate) => candidate.id === roleId);

  if (isLoading) {
    return (
      <Page>
        <PageHeader
          title={t('Role')}
          back={{ label: t('Roles'), to: ROLES_PATH }}
        />
        <SkeletonList numberOfItems={6} className="h-12 w-full" />
      </Page>
    );
  }
  if (isError) {
    return (
      <Page>
        <PageHeader
          title={t('Role')}
          back={{ label: t('Roles'), to: ROLES_PATH }}
        />
        <DataFetchErrorState entity={t('role')} onRetry={refetch} />
      </Page>
    );
  }
  if (!role) {
    return (
      <Page>
        <PageHeader
          title={t('Role')}
          back={{ label: t('Roles'), to: ROLES_PATH }}
        />
        <Empty className="rounded-2xl bg-panel shadow-edge">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Shield />
            </EmptyMedia>
            <EmptyTitle>{t('This role no longer exists')}</EmptyTitle>
            <EmptyDescription>
              {t('It may have been deleted. Pick another role from the list.')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link to={ROLES_PATH}>{t('All roles')}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Page>
    );
  }
  return (
    <RoleEditor
      key={`${role.id}-${role.updated}`}
      role={role}
      roles={data?.data ?? []}
      onSaved={() => refetch()}
    />
  );
}

function RoleEditor({
  role,
  roles,
  onSaved,
}: {
  role: ProjectRole;
  roles: ProjectRole[];
  onSaved: () => void;
}) {
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const canCustomize = platform.plan.customRolesEnabled;
  const isBuiltIn = role.type === RoleType.DEFAULT;
  const readOnly = isBuiltIn || !canCustomize;
  const [name, setName] = useState(role.name);
  const [permissions, setPermissions] = useState<string[]>(role.permissions);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty =
    name.trim() !== role.name ||
    !samePermissions({ left: permissions, right: role.permissions });
  const { mutate, isPending } = projectRoleMutations.useUpsertProjectRole({
    onSave: onSaved,
    onError: (error) =>
      setSaveError(
        api.isApError(error, ErrorCode.VALIDATION)
          ? t('A role with this name already exists')
          : t('Could not save the role. Try again.'),
      ),
  });

  const granted = rolePermissionModel.grantedBoxes({ permissions });
  const total = rolePermissionModel.totalBoxes();
  const discard = () => {
    setName(role.name);
    setPermissions(role.permissions);
    setSaveError(null);
  };

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim().length === 0) {
          setSaveError(t('Give the role a name'));
          return;
        }
        setSaveError(null);
        mutate({
          mode: 'edit',
          roleId: role.id,
          name: name.trim(),
          permissions,
        });
      }}
    >
      <Page
        footer={
          readOnly ? undefined : (
            <>
              {saveError && dirty && (
                <span role="alert" className="text-sm text-danger-11">
                  {saveError}
                </span>
              )}
              <SaveBar dirty={dirty} saving={isPending} onDiscard={discard} />
            </>
          )
        }
      >
        <PageHeader
          back={{ label: t('Roles'), to: ROLES_PATH }}
          title={role.name}
          badge={
            <Badge variant="outline">
              {isBuiltIn ? t('Built in') : t('Custom')}
            </Badge>
          }
          description={[
            roleCopy.plainSummary({ permissions }),
            t('grantedCount', { granted, total }),
          ].join(' · ')}
        >
          <LockedRoleButton locked={!canCustomize}>
            <Button
              variant="outline"
              type="button"
              disabled={!canCustomize}
              onClick={() => setDuplicating(true)}
            >
              <Copy />
              {t('Duplicate')}
            </Button>
          </LockedRoleButton>
        </PageHeader>
        <PageColumns
          main={
            <>
              {isBuiltIn && (
                <p className="text-sm text-gray-11">
                  {t(
                    "Built-in roles can't be changed. Duplicate this one to make a version you can edit.",
                  )}
                </p>
              )}
              {!isBuiltIn && (
                <Panel flush>
                  <SettingRows>
                    <SettingRow
                      title={t('Name')}
                      description={t('Shown wherever someone picks a role.')}
                    >
                      <Input
                        value={name}
                        disabled={readOnly}
                        aria-label={t('Name')}
                        className="w-64"
                        onChange={(event) => {
                          setName(event.target.value);
                          setSaveError(null);
                        }}
                      />
                    </SettingRow>
                  </SettingRows>
                </Panel>
              )}
              {rolePermissionModel.groups().map((group) => (
                <Panel key={group.key} title={group.label} flush>
                  <SettingRows>
                    {group.rows.map((row) => (
                      <SettingRow
                        key={row.key}
                        title={row.label}
                        description={row.hint}
                      >
                        <GrantPicker
                          row={row}
                          value={rolePermissionModel.grantOf({
                            row,
                            permissions,
                          })}
                          disabled={readOnly}
                          onChange={(grant) =>
                            setPermissions(
                              rolePermissionModel.setGrant({
                                permissions,
                                row,
                                grant,
                              }),
                            )
                          }
                        />
                      </SettingRow>
                    ))}
                  </SettingRows>
                </Panel>
              ))}
              {!isBuiltIn && canCustomize && (
                <DangerZone
                  actions={[
                    {
                      title: t('Delete role'),
                      description: t(
                        'People with this role lose access to those projects.',
                      ),
                      control: (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-danger-11 hover:text-danger-11"
                          onClick={() => setDeleting(true)}
                        >
                          {t('Delete role')}
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
            </>
          }
          aside={<RolePeoplePanel role={role} />}
        />
      </Page>
      <NewRoleDialog
        open={duplicating}
        onOpenChange={setDuplicating}
        roles={roles}
        startFromId={role.id}
        onCreated={(created) => {
          onSaved();
          navigate(`/platform/users/roles/${created.id}`);
        }}
      />
      <DeleteRoleDialog
        role={deleting ? role : null}
        onOpenChange={setDeleting}
        onDeleted={() => {
          onSaved();
          navigate(ROLES_PATH);
        }}
      />
    </form>
  );
}

function GrantPicker({
  row,
  value,
  disabled,
  onChange,
}: {
  row: PermissionRow;
  value: PermissionGrant;
  disabled: boolean;
  onChange: (grant: PermissionGrant) => void;
}) {
  const options = rolePermissionModel.grantOptions({ row });
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={value}
      aria-label={row.label}
      aria-readonly={disabled}
      onValueChange={(next) => {
        const match = options.find((option) => option === next);
        if (match && !disabled) {
          onChange(match);
        }
      }}
    >
      {GRANTS.map((grant) => (
        <ToggleGroupItem
          key={grant}
          value={grant}
          disabled={disabled ? grant !== value : !options.includes(grant)}
          className="w-16"
        >
          {grantLabel(grant)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function RolePeoplePanel({ role }: { role: ProjectRole }) {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = projectRoleQueries.useProjectRoleMembers(role.id, true);
  const members = data?.pages.flatMap((page) => page.data) ?? [];
  return (
    <Panel
      title={t('People')}
      description={t(
        'Who has this role, and where. Change it from the project.',
      )}
      flush
    >
      {isLoading ? (
        <div className="p-5">
          <SkeletonList numberOfItems={3} className="h-8 w-full" />
        </div>
      ) : isError ? (
        <div className="p-5">
          <DataFetchErrorState entity={t('people')} onRetry={refetch} />
        </div>
      ) : members.length === 0 ? (
        <p className="p-5 text-sm text-gray-11">
          {t('Nobody has this role yet.')}
        </p>
      ) : (
        <ul className="flex flex-col">
          {members.map((member) => (
            <PersonItem key={member.id} member={member} />
          ))}
          {hasNextPage && (
            <li className="border-t p-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {t('Load more')}
              </Button>
            </li>
          )}
        </ul>
      )}
    </Panel>
  );
}

function PersonItem({ member }: { member: ProjectMemberWithUser }) {
  const name = `${member.user.firstName} ${member.user.lastName}`.trim();
  return (
    <li className="border-t px-5 py-2.5 first:border-t-0">
      <NameCell
        stacked
        media={
          <InitialsTile
            name={name || member.user.email}
            className="rounded-full"
          />
        }
        title={name || member.user.email}
        sub={member.project.displayName}
      />
    </li>
  );
}

function grantLabel(grant: PermissionGrant): string {
  switch (grant) {
    case 'none':
      return t('None');
    case 'view':
      return t('View');
    case 'edit':
      return t('Edit');
  }
}

function samePermissions({
  left,
  right,
}: {
  left: string[];
  right: string[];
}): boolean {
  const rightSet = new Set(right);
  return (
    left.length === right.length &&
    left.every((permission) => rightSet.has(permission))
  );
}

const GRANTS: PermissionGrant[] = ['none', 'view', 'edit'];

const ROLES_PATH = '/platform/users/roles';
