import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';

export function LastProjectDialog({
  open,
  onOpenChange,
  memberName,
}: LastProjectDialogProps) {
  const isPlatformAdmin = useIsPlatformAdmin();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="mb-0">
          <DialogTitle>
            {t('{name} has no other project', { name: memberName })}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {t(
              'Removing them would leave them nowhere to work. Invite them to another project first, then remove them here.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {isPlatformAdmin ? (
              <>
                {t('Want to deactivate them instead?')}{' '}
                <Link
                  to="/platform/users"
                  className="font-medium text-primary hover:underline"
                >
                  {t('Go to Users')}
                </Link>
              </>
            ) : (
              t('Ask a platform admin to deactivate them.')
            )}
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type LastProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
};
