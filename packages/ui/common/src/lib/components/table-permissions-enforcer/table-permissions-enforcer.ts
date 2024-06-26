import { Permission } from '@activepieces/shared';
import { doesUserHavePermission } from '../../service';

export class TablePermissionsEnforcer {
  displayedColumns: string[] = [];
  constructor({
    tableColumns,
    permissionsAndTheirColumns,
  }: {
    permissionsAndTheirColumns: {
      permission: Permission;
      permissionColumns: string[];
    }[];
    tableColumns: string[];
  }) {
    this.displayedColumns = tableColumns;
    permissionsAndTheirColumns.forEach(({ permission, permissionColumns }) => {
      if (this.hasPermission(permission)) {
        this.displayedColumns = [
          ...this.displayedColumns,
          ...permissionColumns,
        ];
      }
    });
  }
  hasPermission(permission: Permission) {
    return doesUserHavePermission(permission);
  }
}
