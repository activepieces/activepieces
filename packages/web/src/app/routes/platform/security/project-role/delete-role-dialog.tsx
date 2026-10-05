import { ProjectRole } from '@activepieces/core-utils';
import { t } from 'i18next';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { projectRoleMutations } from '@/features/platform-admin';

export function DeleteRoleDialog({
  role,
  onOpenChange,
  onDeleted,
}: {
  role: ProjectRole | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const { mutateAsync } = projectRoleMutations.useDeleteProjectRole({
    onSuccess: onDeleted,
  });
  if (!role) {
    return null;
  }
  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title={t('Delete {name}?', { name: role.name })}
      description={t('This action cannot be undone.')}
      consequence={
        (role.userCount ?? 0) > 0
          ? t('rolePeopleRemovedOnDelete', { count: role.userCount ?? 0 })
          : undefined
      }
      confirmLabel={t('Delete role')}
      typeToConfirm={role.name}
      onConfirm={async () => {
        await mutateAsync(role.name);
      }}
    />
  );
}
