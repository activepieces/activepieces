import { FlowPriority } from '@activepieces/shared';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DEFAULT_PRIORITY = 'default';

type SetPriorityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FlowPriority | null;
  onChange: (value: FlowPriority | null) => void;
  onConfirm: () => void;
  isSaving: boolean;
};

export const SetPriorityDialog = ({
  open,
  onOpenChange,
  value,
  onChange,
  onConfirm,
  isSaving,
}: SetPriorityDialogProps) => {
  const priorityOptions: { value: FlowPriority; label: string }[] = [
    { value: 'critical', label: t('Critical') },
    { value: 'high', label: t('High') },
    { value: 'medium', label: t('Medium') },
    { value: 'low', label: t('Low') },
    { value: 'veryLow', label: t('Very Low') },
    { value: 'lowest', label: t('Lowest') },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Set Priority')}</DialogTitle>
          <DialogDescription>
            {t(
              'Choose how this flow’s runs are prioritized in the execution queue. Higher priority runs are picked up first.',
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>{t('Flow Priority')}</Label>
          <Select
            value={value ?? DEFAULT_PRIORITY}
            onValueChange={(newValue) =>
              onChange(
                newValue === DEFAULT_PRIORITY
                  ? null
                  : (newValue as FlowPriority),
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('Select a priority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT_PRIORITY}>
                {t('Default (automatic)')}
              </SelectItem>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={isSaving} loading={isSaving}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
