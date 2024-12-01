import { t } from 'i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { authenticationSession } from '@/lib/authentication-session';
import { PlatformRole } from '@activepieces/shared';

import { Message } from './hooks/notifictions-hooks';

const platformDialogKey = 'platformAlertsLastDismissed';

type PlatformDialogProps = {
  messages: Message[];
};
const PlatformDialog = ({ messages }: PlatformDialogProps) => {
  const navigate = useNavigate();
  const lastDismissed = localStorage.getItem(platformDialogKey);
  const shouldShow =
    messages.filter((message) => message.type === 'destructive').length > 0 &&
    (!lastDismissed || Date.now() - parseInt(lastDismissed) > 15 * 60 * 1000);
  const platformRole = authenticationSession.getUserPlatformRole();
  const [isOpen, setIsOpen] = useState(
    shouldShow && platformRole === PlatformRole.ADMIN,
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('Platform Alerts')}</DialogTitle>
          <DialogDescription>
            {t(
              'There are important platform alerts that require your attention. Please check the alerts section in Platform Admin.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => {
              localStorage.setItem(platformDialogKey, Date.now().toString());
              setIsOpen(false);
              navigate('/platform');
            }}
            variant="destructive"
            className="bg-destructive-300"
          >
            {t('View Alerts')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { PlatformDialog };
