import { t } from 'i18next';
import { Info, Layers, Trash } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TierModelPicker,
  TierModelValue,
} from '@/features/agents/ai-model/tier-model-picker';
import { TIER_CONFIG } from '@/features/agents/tier-config';

import { ModelFacts, MockTier } from '../mock/fixtures';

export function TierCard({
  tier,
  models,
  onSlotChange,
  onDelete,
}: {
  tier: MockTier;
  models: ModelFacts[];
  onSlotChange: (change: { slotKey: SlotKey; modelId: string }) => void;
  onDelete?: () => void;
}) {
  const [showReplaceNote, setShowReplaceNote] = useState(false);
  const mainFacts = models.find((model) => model.id === tier.slots.main.modelId);

  const handleChange = ({
    slotKey,
    value,
  }: {
    slotKey: SlotKey;
    value: TierModelValue;
  }) => {
    if (value.kind !== 'model') {
      return;
    }
    if (slotKey === 'main') {
      setShowReplaceNote(true);
    }
    onSlotChange({ slotKey, modelId: value.id });
  };

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <TierCardIcon tierId={tier.id} />
        <p className="text-sm font-medium leading-none">{tier.name}</p>
        <p className="text-xs text-muted-foreground truncate flex-1">
          {tier.description}
        </p>
        {!tier.builtIn && <Badge variant="outline">{t('Custom')}</Badge>}
        {!tier.builtIn && onDelete && (
          <ConfirmationDeleteDialog
            title={t('Delete custom tier')}
            message={t(
              'Anything still using this tier falls back to the default tier. Flows keep working.',
            )}
            entityName={tier.name}
            mutationFn={async () => onDelete()}
          >
            <Button variant="ghost" size="sm">
              <Trash className="size-4 text-destructive" />
            </Button>
          </ConfirmationDeleteDialog>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {SLOT_KEYS.map((slotKey) => {
          const slot = tier.slots[slotKey];
          return (
            <div key={slotKey} className="flex flex-col gap-1">
              <div className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
                <span
                  className={
                    slotKey === 'main'
                      ? 'text-xs font-medium'
                      : 'text-xs text-muted-foreground'
                  }
                >
                  {SLOT_LABELS[slotKey]()}
                </span>
                <TierModelPicker
                  compact
                  tiers={[]}
                  models={models}
                  disabledModels={
                    slotKey === 'main'
                      ? {}
                      : backupDisabledReasons({ mainFacts, models })
                  }
                  value={{ kind: 'model', id: slot.modelId }}
                  onChange={(value) => handleChange({ slotKey, value })}
                />
              </div>
              {slot.providerDeleted && (
                <div className="grid grid-cols-[5.5rem_1fr] gap-3">
                  <span />
                  <p className="text-xs text-destructive">
                    {t(
                      'This provider was removed from the platform — this backup is skipped at run time.',
                    )}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showReplaceNote && (
        <Alert>
          <Info className="size-4" />
          <AlertDescription>
            {t(
              'Everything using this tier switches instantly. Existing flows keep working — no edits needed.',
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function TierCardIcon({ tierId }: { tierId: string }) {
  const builtIn = Object.entries(TIER_CONFIG).find(([key]) => key === tierId);
  const Icon = builtIn ? builtIn[1].icon : Layers;
  return <Icon className="size-4 text-muted-foreground shrink-0" />;
}

export function backupDisabledReasons({
  mainFacts,
  models,
}: {
  mainFacts: ModelFacts | undefined;
  models: ModelFacts[];
}): Record<string, string> {
  if (!mainFacts) {
    return {};
  }
  const reasons: Record<string, string> = {};
  for (const candidate of models) {
    if (mainFacts.imageGeneration && !candidate.imageGeneration) {
      reasons[candidate.id] = t(
        'Can’t generate images like the Main model can',
      );
      continue;
    }
    if (mainFacts.vision && !candidate.vision) {
      reasons[candidate.id] = t('Can’t read images like the Main model can');
      continue;
    }
    if (mainFacts.embeddings && !candidate.embeddings) {
      reasons[candidate.id] = t(
        'Doesn’t support embeddings like the Main model does',
      );
    }
  }
  return reasons;
}

export const SLOT_KEYS = ['main', 'backup1', 'backup2'] as const;

export type SlotKey = (typeof SLOT_KEYS)[number];

const SLOT_LABELS: Record<SlotKey, () => string> = {
  main: () => t('Main'),
  backup1: () => t('Backup 1'),
  backup2: () => t('Backup 2'),
};
