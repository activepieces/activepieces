// TODO This is incompleted and will be fixed later.
import { Plus } from 'lucide-react';
import React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomAuthProperty } from '@activepieces/pieces-framework';

import { ConnectionDialog } from './connection-dialog';

type ConnectionSelectProps = {
  auth: CustomAuthProperty<any> | undefined;
};
const ConnectionSelect = React.memo((params: ConnectionSelectProps) => {
  const [connectionDialogOpen, setConnectionDialogOpen] = React.useState(false);

  return (
    <>
      <ConnectionDialog
        auth={params.auth}
        open={connectionDialogOpen}
        setOpen={setConnectionDialogOpen}
      ></ConnectionDialog>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <div
            onClick={() => setConnectionDialogOpen(true)}
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex items-center gap-1 text-primary w-full">
              <Plus size={16} />
              Create Connection
            </span>
          </div>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
});

ConnectionSelect.displayName = 'ConnectionSelect';
export { ConnectionSelect };
