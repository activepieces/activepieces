import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export const ImportFlowDialog = (props: { children: React.ReactNode }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Import a flow as a .json file</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button>Import File</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
