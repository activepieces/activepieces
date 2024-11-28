import React, { useState } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PlatformDialogProps {
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
}

const PlatformDialog: React.FC<PlatformDialogProps> = ({
    title,
    description,
    actionText = 'Close',
    onAction,
}) => {
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => setIsOpen(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription dangerouslySetInnerHTML={{ __html: description }} />
                </DialogHeader>
                <DialogFooter>
                    {onAction && (
                        <Button
                            onClick={() => {
                                onAction();
                                handleClose();
                            }}
                            variant="destructive"
                            className='bg-destructive-300'
                        >
                            {actionText}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { PlatformDialog };
