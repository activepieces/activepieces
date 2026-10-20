import { isNil } from '@activepieces/core-utils';
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
  projectName,
  currentLimitUsd,
  open,
  onOpenChange,
  onSave,
}: SetLimitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <LimitForm
          key={open ? 'open' : 'closed'}
          projectName={projectName}
          currentLimitUsd={currentLimitUsd}
          onCancel={() => onOpenChange(false)}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}

function LimitForm({
  projectName,
  currentLimitUsd,
  onCancel,
  onSave,
}: LimitFormProps) {
  const [value, setValue] = useState(
    isNil(currentLimitUsd) ? '' : String(currentLimitUsd),
  );
  const parsed = Number(value);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(Math.round(parsed));
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {t('Monthly AI limit for {project}', { project: projectName })}
        </DialogTitle>
        <DialogDescription>
          {t(
            'When the project reaches the limit, new AI calls stop until the 1st of next month (UTC) or until you raise it. Calls already running finish.',
          )}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="usage-limit">{t('Limit per month (USD)')}</Label>
        <Input
          id="usage-limit"
          type="number"
          min={1}
          step={1}
          placeholder="100"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <DialogFooter className="gap-2 sm:justify-between">
        {isNil(currentLimitUsd) ? (
          <span />
        ) : (
          <Button type="button" variant="ghost" onClick={() => onSave(null)}>
            {t('Remove limit')}
          </Button>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button type="submit" disabled={!(parsed >= 1)}>
            {t('Save limit')}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

type SetLimitDialogProps = {
  projectName: string;
  currentLimitUsd: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (limitUsd: number | null) => void;
};

type LimitFormProps = {
  projectName: string;
  currentLimitUsd: number | null;
  onCancel: () => void;
  onSave: (limitUsd: number | null) => void;
};
