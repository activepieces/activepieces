import { tryCatch } from '@activepieces/core-utils';
import { PlatformModelTier } from '@activepieces/shared';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { platformModelTierMutations } from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';

export function DeleteTierDialog({
  tier,
  tiers,
  specificModelsVisible,
  onOpenChange,
  returnFocusTo,
}: DeleteTierDialogProps) {
  return (
    <Dialog open={tier !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={(event) => {
          if (returnFocusTo) {
            event.preventDefault();
            returnFocusTo.focus();
          }
        }}
      >
        {tier !== null && (
          <DeleteTierForm
            key={tier.id}
            tier={tier}
            tiers={tiers}
            specificModelsVisible={specificModelsVisible}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteTierForm({
  tier,
  tiers,
  specificModelsVisible,
  onClose,
}: {
  tier: PlatformModelTier;
  tiers: PlatformModelTier[];
  specificModelsVisible: boolean;
  onClose: () => void;
}) {
  const replacements = tiers.filter((candidate) => candidate.id !== tier.id);
  const isLast = replacements.length === 0;
  const [replacedBy, setReplacedBy] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const { mutate: remove, isPending: removing } =
    platformModelTierMutations.useDelete();
  const { mutateAsync: setVisible, isPending: flipping } =
    platformModelTierMutations.useSetSpecificModelsVisible();
  const replacement = replacements.find(
    (candidate) => candidate.id === replacedBy,
  );
  const needsFlip = isLast && !specificModelsVisible;
  const busy = removing || flipping;

  const confirm = async () => {
    setError(undefined);
    if (needsFlip) {
      const { error: flipError } = await tryCatch(() => setVisible(true));
      if (flipError) {
        setError(
          api.extractServerErrorMessage(
            flipError,
            t('Could not show specific models to builders'),
          ),
        );
        return;
      }
    }
    remove(
      { id: tier.id, replacedBy },
      {
        onSuccess: onClose,
        onError: (removeError) =>
          setError(
            api.extractServerErrorMessage(
              removeError,
              t('Could not delete this tier'),
            ),
          ),
      },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{t('Delete {name}?', { name: tier.name })}</DialogTitle>
        <DialogDescription>
          {isLast
            ? t('This is your last tier.')
            : t('Anything using {name} moves to the tier you pick.', {
                name: tier.name,
              })}
        </DialogDescription>
      </DialogHeader>

      {isLast ? (
        <div className="flex flex-col gap-2 rounded-md border border-warning-7 bg-warning-2 p-3 text-sm text-warning-11">
          <p className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              {t(
                'Anything still using {name} will stop working until someone picks a new model.',
                { name: tier.name },
              )}
            </span>
          </p>
          {needsFlip && (
            <p className="pl-6">
              {t(
                'Specific models will be shown to builders again, so they still have something to pick.',
              )}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tier-replacement">{t('Move them to')}</Label>
          <Select value={replacedBy} onValueChange={setReplacedBy}>
            <SelectTrigger id="tier-replacement">
              <SelectValue placeholder={t('Pick a tier')} />
            </SelectTrigger>
            <SelectContent>
              {replacements.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{candidate.emoji}</span>
                    <span>{candidate.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {replacement !== undefined && tier.isDefault && (
            <p className="text-xs text-gray-11">
              {t('{name} becomes the default tier.', {
                name: replacement.name,
              })}
            </p>
          )}
          {replacement !== undefined && tier.isFast && (
            <p className="text-xs text-gray-11">
              {t('{name} becomes the fast tier.', { name: replacement.name })}
            </p>
          )}
        </div>
      )}

      {error !== undefined && (
        <p className="text-sm text-danger-11" role="alert">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button
          type="button"
          variant="destructive"
          loading={busy}
          disabled={busy || (!isLast && replacedBy === undefined)}
          onClick={confirm}
          {...adminControl(AdminControl.AI_TIER_DELETE_CONFIRM)}
        >
          {t('Delete tier')}
        </Button>
      </DialogFooter>
    </div>
  );
}

type DeleteTierDialogProps = {
  tier: PlatformModelTier | null;
  tiers: PlatformModelTier[];
  specificModelsVisible: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusTo?: HTMLElement | null;
};
