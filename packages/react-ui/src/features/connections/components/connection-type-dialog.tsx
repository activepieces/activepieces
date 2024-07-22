import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import React from "react";

type ConnectionTypeDialogProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

const ConnectionTypeDialog = React.memo(({ open, setOpen }: ConnectionTypeDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Connection</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-4">
                    <div className="border p-2 flex flex-col items-center justify-center">
                        <div>Code Piece</div>
                        <img className="w-[50px] h-[50px]" src="https://cdn.activepieces.com/pieces/code.svg">
                        </img>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
},
);

ConnectionTypeDialog.displayName = 'ConnectionTypeDialog';
export { ConnectionTypeDialog };