import { t } from 'i18next';
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
  open,
  onOpenChange,
  membersWithoutPersonalProject,
  isCountLoading,
  isPending,
  onConfirm,
}: TurnOnPersonalProjectsDialogProps) {
  const [createForExistingMembers, setCreateForExistingMembers] =
    useState(false);
  const offersExistingMembers =
    !isCountLoading &&
    (membersWithoutPersonalProject === null ||
      membersWithoutPersonalProject > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setCreateForExistingMembers(false);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Turn on personal projects?')}</DialogTitle>
          <DialogDescription>
            {t('New members get a personal project when they join.')}
          </DialogDescription>
        </DialogHeader>
        {offersExistingMembers && (
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
            {membersWithoutPersonalProject === null
              ? t("Also create one for members who don't have one yet")
              : t('createForMembersWithoutOne', {
                  count: membersWithoutPersonalProject,
                })}
          </label>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            loading={isPending}
            disabled={isCountLoading}
            onClick={() =>
              onConfirm({
                createForExistingMembers:
                  offersExistingMembers && createForExistingMembers,
              })
            }
          >
            {t('Turn on')}
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membersWithoutPersonalProject: number | null;
  isCountLoading: boolean;
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
