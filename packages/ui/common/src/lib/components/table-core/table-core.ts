import { Permission } from '@activepieces/shared';
import { doesUserHavePermission } from '../../service';

export class TableCore {
  displayedColumns: string[] = [];
  constructor({ tableColumns }: { tableColumns: string[] }) {
    this.displayedColumns = tableColumns;
  }
  hasPermission(permission: Permission) {
    return doesUserHavePermission(permission);
  }
}
