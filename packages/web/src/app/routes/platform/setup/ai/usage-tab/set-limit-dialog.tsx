import { t } from 'i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SetLimitDialog({
  open,
  onOpenChange,
  projectName,
  currentLimit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  currentLimit: number | null;
  onSave: (limit: number | null) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <SetLimitForm
          key={open ? projectName : 'closed'}
          projectName={projectName}
          currentLimit={currentLimit}
          onSave={(limit) => {
            onSave(limit);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function SetLimitForm({
  projectName,
  currentLimit,
  onSave,
}: {
  projectName: string;
  currentLimit: number | null;
  onSave: (limit: number | null) => void;
}) {
  const [raw, setRaw] = useState(
    currentLimit === null ? '' : String(currentLimit),
  );
  const parsed = Number(raw);
  const valid = raw.trim().length > 0 && Number.isFinite(parsed) && parsed > 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('AI limit for {projectName}', { projectName })}
        </DialogTitle>
        <DialogDescription>
          {t(
            'Once the limit is reached, further AI requests in this project are blocked until the next billing cycle.',
          )}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-limit">{t('Monthly AI credits limit')}</Label>
        <Input
          id="ai-limit"
          type="number"
          min={1}
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder={t('e.g. 10000')}
        />
      </div>
      <DialogFooter className="gap-2 sm:justify-between">
        <div>
          {currentLimit !== null && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onSave(null)}
            >
              {t('Remove limit')}
            </Button>
          )}
        </div>
        <Button type="button" disabled={!valid} onClick={() => onSave(parsed)}>
          {t('Save limit')}
        </Button>
      </DialogFooter>
    </>
  );
}
