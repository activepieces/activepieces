import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

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

export function TurnOnPersonalProjectsDialog({
  onClose,
  membersWithoutPersonalProject,
  isPending,
  onConfirm,
}: TurnOnPersonalProjectsDialogProps) {
  const [createForExistingMembers, setCreateForExistingMembers] =
    useState(false);

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
            {t('New members get a personal project when they join.')}
          </DialogDescription>
        </DialogHeader>
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
          {t('createForMembersWithoutPersonalProject', {
            count: membersWithoutPersonalProject,
          })}
        </label>
        {createForExistingMembers && (
          <span className="flex items-center gap-1.5 pl-6 text-sm text-warning-11">
            <TriangleAlert className="size-3.5 shrink-0" />
            {t('createsPersonalProjectsNow', {
              count: membersWithoutPersonalProject,
            })}
          </span>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            loading={isPending}
            onClick={() => onConfirm({ createForExistingMembers })}
          >
            {createForExistingMembers
              ? t('turnOnAndCreate', { count: membersWithoutPersonalProject })
              : t('Turn on')}
          </Button>
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
        <DialogHeader className="mb-0">
          <DialogTitle>{t('Turn off personal projects?')}</DialogTitle>
          <DialogDescription className="pt-1 text-gray-12">
            {t("New members won't get a personal project.")}
          </DialogDescription>
          {personalProjectCount > 0 && (
            <p className="text-sm text-gray-11">
              {t('Members keep their existing personal projects.')}{' '}
              <Link
                to="/platform/projects"
                className="whitespace-nowrap font-medium text-accent-11 hover:underline"
              >
                {t('manageAllPersonalProjectsInProjects', {
                  count: personalProjectCount,
                })}
              </Link>
            </p>
          )}
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button loading={isPending} onClick={onConfirm}>
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
