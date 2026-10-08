import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export function TurnOnPersonalProjectsDialog({
  open,
  onOpenChange,
  membersWithoutPersonalProject,
  isPending,
  onConfirm,
}: TurnOnPersonalProjectsDialogProps) {
  const [scope, setScope] = useState<TurnOnScope>('new-members');
  const offersExistingMembers = membersWithoutPersonalProject > 0;
  const createsForExistingMembers =
    offersExistingMembers && scope === 'existing-members';

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setScope('new-members');
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
          <RadioGroup
            value={scope}
            onValueChange={(value) =>
              setScope(
                value === 'existing-members'
                  ? 'existing-members'
                  : 'new-members',
              )
            }
            className="gap-2"
          >
            <TurnOnOption
              value="new-members"
              selected={scope === 'new-members'}
              title={t('New members only')}
            />
            <TurnOnOption
              value="existing-members"
              selected={scope === 'existing-members'}
              title={t('createForExistingMembers', {
                count: membersWithoutPersonalProject,
              })}
              warning={t('createsPersonalProjectsNow', {
                count: membersWithoutPersonalProject,
              })}
            />
          </RadioGroup>
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
            onClick={() =>
              onConfirm({ createForExistingMembers: createsForExistingMembers })
            }
          >
            {createsForExistingMembers
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

function TurnOnOption({ value, selected, title, warning }: TurnOnOptionProps) {
  const id = `personal-projects-${value}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer flex-col gap-1.5 rounded-lg border p-3',
        selected && 'border-primary bg-primary/5',
      )}
    >
      <span className="flex items-center gap-3">
        <RadioGroupItem id={id} value={value} />
        <span className="text-sm font-medium">{title}</span>
      </span>
      {selected && warning && (
        <span className="flex items-center gap-1.5 pl-7 text-sm text-warning-11">
          <TriangleAlert className="size-3.5 shrink-0" />
          {warning}
        </span>
      )}
    </label>
  );
}

type TurnOnScope = 'new-members' | 'existing-members';

type TurnOnOptionProps = {
  value: TurnOnScope;
  selected: boolean;
  title: string;
  warning?: string;
};

type TurnOnPersonalProjectsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
