import { useState } from 'react';

import { AppConnectionsTable } from '@/app/connections/connection-table';
import { NewConnectionTypeDialog } from '@/app/connections/new-connection-type-dialog';

export default function AppConnectionsPage() {
  const [openNewConnectionDialog, setOpenNewConnectionDialog] = useState(false);

  return (
    <>
      <NewConnectionTypeDialog
        open={openNewConnectionDialog}
        setOpen={setOpenNewConnectionDialog}
      ></NewConnectionTypeDialog>
      <AppConnectionsTable
        newConnectionClicked={() => setOpenNewConnectionDialog(true)}
      ></AppConnectionsTable>
    </>
  );
}
