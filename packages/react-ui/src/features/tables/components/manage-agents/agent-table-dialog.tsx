import { t } from 'i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AgentTableDialogProps {
  onConfirm: (triggerType: 'row_created' | 'row_updated', behavior: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function AgentTableDialog({
  onConfirm,
  children,
  disabled = false,
}: AgentTableDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<'row_created' | 'row_updated'>('row_created');
  const [behavior, setBehavior] = useState('');

  const handleConfirm = () => {
    onConfirm(selectedTrigger, behavior);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[700px]">
        <DialogHeader>
          <DialogTitle>{t('Configure Agent Trigger')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="mb-2 text-base">{t('When would you like to trigger?')}</div>
            <Select
              value={selectedTrigger}
              onValueChange={(value) => setSelectedTrigger(value as 'row_created' | 'row_updated')}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t('Select trigger')}
                  aria-label={selectedTrigger}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="row_created">{t('Row Created')}</SelectItem>
                <SelectItem value="row_updated">{t('Row Updated')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="mb-2 text-base">{t('Behavior')}</div>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder={t('Describe the behavior of the agent...')}
              value={behavior}
              onChange={e => setBehavior(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                {t('Cancel')}
              </Button>
            </DialogClose>
            <Button
              onClick={handleConfirm}
              disabled={disabled}
            >
              {t('Configure Agent')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}