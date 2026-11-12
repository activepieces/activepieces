import { ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function TurnOnPersonalProjectsDialog({
  onClose,
  membersWithoutPersonalProject,
  isPending,
  onConfirm,
}: TurnOnPersonalProjectsDialogProps) {
  const [createForExistingMembers, setCreateForExistingMembers] =
    useState(false);
  const hasMembersToOffer = membersWithoutPersonalProject > 0;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Turn on personal projects?')}</DialogTitle>
          <DialogDescription>
            {t('New members get their own personal project when they join.')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter
          className={cn(
            hasMembersToOffer &&
              'flex-col sm:flex-row sm:items-center sm:justify-between',
          )}
        >
          {hasMembersToOffer && (
            <label
              htmlFor={EXISTING_MEMBERS_CHECKBOX_ID}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                id={EXISTING_MEMBERS_CHECKBOX_ID}
                checked={createForExistingMembers}
                onCheckedChange={(checked) =>
                  setCreateForExistingMembers(checked === true)
                }
              />
              {t('createForExistingMembers', {
                count: membersWithoutPersonalProject,
              })}
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={isPending} onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              loading={isPending}
              onClick={() => onConfirm({ createForExistingMembers })}
            >
              {t('Turn on')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TurnOffPersonalProjectsDialog({
  open,
  onOpenChange,
  personalProjectCount,
  isPending,
  onConfirm,
}: TurnOffPersonalProjectsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Turn off personal projects?')}</DialogTitle>
          <DialogDescription>
            {t('Members keep the personal projects they already have.')}
            {personalProjectCount > 0 && (
              <>
                {' '}
                <Link
                  to={`/platform/projects?type=${ProjectType.PERSONAL}`}
                  className="whitespace-nowrap font-medium text-accent-11 hover:underline"
                >
                  {t('manageAllPersonalProjectsInProjects', {
                    count: personalProjectCount,
                  })}
                </Link>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <Alert variant="warning" className="bg-warning-3">
          <TriangleAlert className="size-4" />
          <AlertDescription>
            {t("New members won't get a personal project.")}
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button variant="destructive" loading={isPending} onClick={onConfirm}>
            {t('Turn off')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const EXISTING_MEMBERS_CHECKBOX_ID = 'personal-projects-existing-members';

type TurnOnPersonalProjectsDialogProps = {
  onClose: () => void;
  membersWithoutPersonalProject: number;
  isPending: boolean;
  onConfirm: (params: { createForExistingMembers: boolean }) => void;
};

type TurnOffPersonalProjectsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personalProjectCount: number;
  isPending: boolean;
  onConfirm: () => void;
};
