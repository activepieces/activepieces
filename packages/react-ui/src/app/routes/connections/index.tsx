import { useState } from 'react';

import { AppConnectionsTable } from '@/features/connections/components/connection-table';

import { NewConnectionTypeDialog } from '../../../features/connections/components/new-connection-type-dialog';

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
