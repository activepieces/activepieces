import { ProjectRole, RoleType } from '@activepieces/core-utils';
import { ProjectMemberWithUser } from '@activepieces/shared';
import {
  ArrowUpRight01Icon,
  Copy01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { UnsavedChangesGuard } from '@/components/custom/leave-without-saving';
import { InitialsTile } from '@/components/custom/list/list-cells';
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
import { projectRoleErrorMessage } from '@/features/platform-admin/hooks/project-role-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { useCustomRolesLock } from './custom-roles-lock';
import { CustomRolesLockedCallout } from './custom-roles-locked-callout';
import { DeleteRoleDialog } from './delete-role-dialog';
import { NewRoleDialog } from './new-role-dialog';
import { rolesPlan } from './sample-roles';

export function RoleDetailPage() {
  const { roleId } = useParams();
  const { platform } = platformHooks.useCurrentPlatform();
  const isSample = rolesPlan.isLocked(platform.plan);
  const { data, isLoading, isError, refetch } =
    projectRoleQueries.useProjectRoles(!isSample);
  const roles = isSample ? rolesPlan.sampleRoles() : data?.data ?? [];
  const role = roles.find((candidate) => candidate.id === roleId);

  if (!isSample && isLoading) {
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
  if (!isSample && isError) {
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
              <HugeiconsIcon icon={Shield01Icon} />
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
      roles={roles}
      isSample={isSample}
      onSaved={() => refetch()}
    />
  );
}

function RoleEditor({
  role,
  roles,
  isSample,
  onSaved,
}: {
  role: ProjectRole;
  roles: ProjectRole[];
  isSample: boolean;
  onSaved: () => void;
}) {
  const navigate = useNavigate();
  const isBuiltIn = role.type === RoleType.DEFAULT;
  const customRolesLock = useCustomRolesLock();
  const customLocked = !isSample && customRolesLock.locked;
  const readOnly = isBuiltIn || isSample || customLocked;
  const [name, setName] = useState(role.name);
  const [permissions, setPermissions] = useState<string[]>(role.permissions);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const leaving = useRef(false);

  const dirty =
    name.trim() !== role.name ||
    !samePermissions({ left: permissions, right: role.permissions });
  const { mutate, isPending } = projectRoleMutations.useUpsertProjectRole({
    onSave: () => {
      toast.success(t('Changes saved'));
      onSaved();
    },
    onError: (error) => setSaveError(projectRoleErrorMessage(error)),
  });

  const granted = rolePermissionModel.grantedBoxes({ permissions });
  const total = rolePermissionModel.totalBoxes();
  const discard = () => {
    setName(role.name);
    setPermissions(role.permissions);
    setSaveError(null);
  };

  return (
    <>
      <form
        className="contents"
        onSubmit={(event) => {
          event.preventDefault();
          if (readOnly || isPending) {
            return;
          }
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
              <SaveBar
                dirty={dirty}
                saving={isPending}
                invalid={name.trim().length === 0}
                error={dirty ? saveError : null}
                onDiscard={discard}
                saveControl={AdminControl.ROLES_EDIT_SUBMIT}
              />
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
            <Button
              variant="outline"
              type="button"
              disabled={customLocked}
              title={customLocked ? customRolesLock.reason : undefined}
              {...adminControl(AdminControl.ROLES_NEW_OPEN)}
              onClick={() => setDuplicating(true)}
            >
              <HugeiconsIcon icon={Copy01Icon} />
              {t('Duplicate')}
            </Button>
          </PageHeader>
          <PageColumns
            main={
              <>
                {customLocked && <CustomRolesLockedCallout />}
                {isBuiltIn && !customLocked && (
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
                {!readOnly && (
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
                            {...adminControl(AdminControl.ROLES_DELETE_OPEN)}
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
            aside={<RolePeoplePanel role={role} isSample={isSample} />}
          />
        </Page>
      </form>
      <UnsavedChangesGuard dirty={dirty && !readOnly} standDown={leaving} />
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
          leaving.current = true;
          onSaved();
          navigate(ROLES_PATH);
        }}
      />
    </>
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
          {...adminControl(AdminControl.ROLES_PERMISSION_TOGGLE)}
        >
          {grantLabel(grant)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function RolePeoplePanel({
  role,
  isSample,
}: {
  role: ProjectRole;
  isSample: boolean;
}) {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = projectRoleQueries.useProjectRoleMembers(role.id, !isSample);
  const members = data?.pages.flatMap((page) => page.data) ?? [];
  return (
    <Panel
      title={t('People')}
      description={t(
        'Who has this role, and where. Change it from the project.',
      )}
      flush
    >
      {isSample ? (
        <p className="p-5 text-sm text-gray-11">
          {t('Sample role. People appear here once you create real roles.')}
        </p>
      ) : isLoading ? (
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
    <li className="border-t first:border-t-0">
      <Link
        to={`/projects/${member.project.id}/settings/team`}
        {...adminControl(AdminControl.ROLES_PEOPLE_OPEN)}
        className="group flex min-w-0 items-center gap-3 px-5 py-2.5 outline-hidden hover:bg-gray-2 focus-visible:bg-gray-2"
      >
        <InitialsTile
          name={name || member.user.email}
          className="rounded-full"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-gray-12">
            {name || member.user.email}
          </span>
          <span className="truncate text-xs text-gray-11">
            {name
              ? `${member.user.email} · ${member.project.displayName}`
              : member.project.displayName}
          </span>
        </span>
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          aria-hidden
          className="size-4 shrink-0 text-gray-9 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        />
      </Link>
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
