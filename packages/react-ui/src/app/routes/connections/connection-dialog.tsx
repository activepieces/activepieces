import React from 'react';

import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/seperator';
import { CustomAuthProperty } from '@activepieces/pieces-framework';

import { AutoPropertiesFormComponent } from '../../builder/step-settings/auto-properties-form';

type ConnectionDialogProps = {
  auth: CustomAuthProperty<any> | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ConnectionDialog = React.memo(
  ({ auth, open, setOpen }: ConnectionDialogProps) => {
    return (
      <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create Connection</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ApMarkdown markdown={auth?.description}></ApMarkdown>
          {auth?.description && <Separator className="my-6" />}
          <AutoPropertiesFormComponent
            props={auth?.props}
            allowDynamicValues={false}
            renderSecretText={true}
          ></AutoPropertiesFormComponent>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} className="w-full">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

ConnectionDialog.displayName = 'ConnectionDialog';
export { ConnectionDialog };
