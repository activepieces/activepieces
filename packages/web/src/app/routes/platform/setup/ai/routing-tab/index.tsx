import { t } from 'i18next';
import { Info, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  MODEL_CATALOG,
  MockScenario,
  MockTier,
  SCENARIOS,
} from '../mock/fixtures';

import { CreateTierDialog } from './create-tier-dialog';
import { SlotKey, TierCard } from './tier-card';

export function RoutingTab({ scenario }: { scenario: MockScenario }) {
  const [tiers, setTiers] = useState(scenario.routing.tiers);
  const [isDefault, setIsDefault] = useState(scenario.routing.isDefault);
  const [createOpen, setCreateOpen] = useState(false);

  const updateSlot = ({
    tierId,
    slotKey,
    modelId,
  }: {
    tierId: string;
    slotKey: SlotKey;
    modelId: string;
  }) => {
    const model = MODEL_CATALOG.find((candidate) => candidate.id === modelId);
    if (!model) {
      return;
    }
    setTiers((current) =>
      current.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              slots: {
                ...tier.slots,
                [slotKey]: { provider: model.provider, modelId: model.id },
              },
            }
          : tier,
      ),
    );
    setIsDefault(false);
  };

  const addTier = (tier: MockTier) => {
    setTiers((current) => [...current, tier]);
    setIsDefault(false);
  };

  const deleteTier = (tierId: string) => {
    setTiers((current) => current.filter((tier) => tier.id !== tierId));
  };

  const resetToDefaults = () => {
    setTiers(SCENARIOS.defaults.routing.tiers);
    setIsDefault(true);
  };

  if (tiers.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1 rounded-lg border border-dashed p-6">
        <p className="text-sm font-medium">{t('No routing to configure yet')}</p>
        <p className="text-sm text-muted-foreground">
          {t(
            'Enable at least one AI provider first — routing defaults are derived from your providers.',
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <p className="text-sm text-muted-foreground flex-1">
          {t(
            'Each tier runs its Main model and falls over to Backup 1, then Backup 2, when a provider fails. Backups must support everything the Main model supports.',
          )}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {!isDefault && (
            <ConfirmationDeleteDialog
              title={t('Reset to defaults')}
              message={t(
                'This removes your custom model routing and falls back to the defaults derived from your chat provider.',
              )}
              entityName={t('Model Routing')}
              buttonText={t('Reset')}
              mutationFn={async () => resetToDefaults()}
            >
              <Button variant="outline" size="sm" type="button">
                <RotateCcw className="size-4 mr-2" />
                {t('Reset to defaults')}
              </Button>
            </ConfirmationDeleteDialog>
          )}
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t('Add custom tier')}
          </Button>
        </div>
      </div>

      {isDefault && (
        <Alert>
          <Info className="size-4" />
          <AlertDescription className="flex items-center gap-2">
            {t(
              'Using defaults derived from your chat provider. Change any slot to customize.',
            )}
            <Badge variant="outline">{t('Using defaults')}</Badge>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            models={MODEL_CATALOG}
            onSlotChange={({ slotKey, modelId }) =>
              updateSlot({ tierId: tier.id, slotKey, modelId })
            }
            onDelete={
              tier.builtIn ? undefined : () => deleteTier(tier.id)
            }
          />
        ))}
      </div>

      <CreateTierDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        models={MODEL_CATALOG}
        onCreate={addTier}
      />
    </div>
  );
}
