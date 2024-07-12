import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";


type ConfirmationDeleteDialogProps = {
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    children: React.ReactNode
}
export function ConfirmationDeleteDialog({ onClose, onConfirm, children, message, title }: ConfirmationDeleteDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle> 
                    <DialogDescription>
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant={"outline"} onClick={onClose}>Close</Button>
                    <Button variant={"destructive"} onClick={onConfirm}>Yes, delete</Button>

                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}