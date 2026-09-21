import { t } from 'i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import {
  PermissionColumn,
  PermissionGroup,
  PermissionRow,
  rolePermissionModel,
} from './role-permissions';

export function PermissionGrid({
  permissions,
  changedRowKeys,
  readOnly,
  onPermissionsChange,
}: PermissionGridProps) {
  const groups = rolePermissionModel.groups();
  const granted = new Set(permissions);

  const toggle = ({ row, column, checked }: ToggleParams) => {
    onPermissionsChange(
      rolePermissionModel.toggleBox({ permissions, row, column, checked }),
    );
  };

  const renderColumn = (
    columnGroups: PermissionGroup[],
    className?: string,
  ) => (
    <div className={cn('flex flex-col', className)}>
      <ColumnHeader />
      {columnGroups.map((group) => (
        <div key={group.key} className="flex flex-col">
          <p className="pt-3 pb-1 text-xss font-medium uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          {group.rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center gap-2 border-b border-border/60 py-1.5 last:border-b-0"
            >
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  changedRowKeys?.includes(row.key)
                    ? 'bg-primary'
                    : 'bg-transparent',
                )}
              />
              <span className="flex min-w-0 flex-1 items-baseline gap-2 text-sm">
                <span className="truncate">{row.label}</span>
                {row.viewAlwaysOn && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t('view always on')}
                  </span>
                )}
              </span>
              <Box
                permission={row.view}
                checked={Boolean(row.view && granted.has(row.view))}
                disabled={readOnly || row.viewAlwaysOn}
                label={t('View {resource}', { resource: row.label })}
                onCheckedChange={(checked) =>
                  toggle({ row, column: 'view', checked })
                }
              />
              <Box
                permission={row.edit}
                checked={Boolean(row.edit && granted.has(row.edit))}
                disabled={readOnly}
                label={t('Edit {resource}', { resource: row.label })}
                onCheckedChange={(checked) =>
                  toggle({ row, column: 'edit', checked })
                }
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
        {renderColumn(groups.filter((group) => group.key === 'build'))}
        {renderColumn(
          groups.filter((group) => group.key !== 'build'),
          'md:border-l md:border-border/60 md:pl-8',
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t('Flow status has no view-only level, so it has no View box.')}
      </p>
    </div>
  );
}

function ColumnHeader() {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 pb-1">
      <span className="size-1.5 shrink-0" />
      <span className="flex-1" />
      <span className="w-12 shrink-0 text-center text-xss font-medium uppercase tracking-wider text-muted-foreground">
        {t('View')}
      </span>
      <span className="w-12 shrink-0 text-center text-xss font-medium uppercase tracking-wider text-muted-foreground">
        {t('Edit')}
      </span>
    </div>
  );
}

function Box({
  permission,
  checked,
  disabled,
  label,
  onCheckedChange,
}: BoxProps) {
  return (
    <span className="flex w-12 shrink-0 justify-center">
      {permission && (
        <Checkbox
          checked={checked}
          disabled={disabled}
          aria-label={label}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
      )}
    </span>
  );
}

type ToggleParams = {
  row: PermissionRow;
  column: PermissionColumn;
  checked: boolean;
};

type BoxProps = {
  permission?: string;
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};

type PermissionGridProps = {
  permissions: string[];
  changedRowKeys?: string[];
  readOnly: boolean;
  onPermissionsChange: (permissions: string[]) => void;
};
