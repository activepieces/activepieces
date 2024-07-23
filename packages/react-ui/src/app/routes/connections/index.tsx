import { AppConnectionsTable } from '@/features/connections/components/connection-table';
import { useState } from 'react';
import { ConnectionTypeDialog } from './connection-type-dialog';

export default function AppConnectionsPage() {

  const [openNewConnectionDialog, setOpenNewConnectionDialog] = useState(false);

  return <>
    <ConnectionTypeDialog open={openNewConnectionDialog} setOpen={setOpenNewConnectionDialog}></ConnectionTypeDialog>
    <AppConnectionsTable newConnectionClicked={() => setOpenNewConnectionDialog(true)}></AppConnectionsTable>
  </>
}
