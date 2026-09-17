import { t } from 'i18next';
import React, { useEffect } from 'react';
import { unstable_useBlocker } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function useWarnBeforeLosingChanges({
  hasChanges,
  standDown,
  blockSearchChanges = false,
}: {
  hasChanges: boolean;
  standDown: React.RefObject<boolean>;
  blockSearchChanges?: boolean;
}) {
  const blocker = unstable_useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges &&
      standDown.current !== true &&
      (currentLocation.pathname !== nextLocation.pathname ||
        (blockSearchChanges && currentLocation.search !== nextLocation.search)),
  );

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (standDown.current === true) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  return blocker;
}

export function LeaveWithoutSavingDialog({
  open,
  onKeepEditing,
  onDiscard,
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onKeepEditing();
      }}
    >
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('Leave without saving?')}</DialogTitle>
          <DialogDescription>
            {t(
              'These edits have not gone live yet. Leave now and they are discarded.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onKeepEditing}>
            {t('Keep editing')}
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            {t('Discard changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
