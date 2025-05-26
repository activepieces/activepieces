import { t } from 'i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface CreateMcpServerDialogProps {
  onCreateMcp: (name: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const CreateMcpServerDialog = ({
  onCreateMcp,
  disabled = false,
  children,
}: CreateMcpServerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    if (name.trim()) {
      onCreateMcp(name.trim());
      setName('');
      setOpen(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setName('');
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('Create MCP Server')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="w-full flex flex-col gap-2 justify-between items-start">
            <span className="w-16 text-sm font-medium text-gray-700">
              {t('Name')}
            </span>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('e.g. Email Services MCP')}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={disabled}
          >
            {t('Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            {t('Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
