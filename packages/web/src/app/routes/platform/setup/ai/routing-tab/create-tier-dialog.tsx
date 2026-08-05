import { t } from 'i18next';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TierModelPicker,
  TierModelValue,
} from '@/features/agents/ai-model/tier-model-picker';

import { ModelFacts, MockTier } from '../mock/fixtures';

import { backupDisabledReasons } from './tier-card';

export function CreateTierDialog({
  open,
  onOpenChange,
  models,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: ModelFacts[];
  onCreate: (tier: MockTier) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <CreateTierForm
          key={open ? 'open' : 'closed'}
          models={models}
          onCreate={(tier) => {
            onCreate(tier);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function CreateTierForm({
  models,
  onCreate,
}: {
  models: ModelFacts[];
  onCreate: (tier: MockTier) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [main, setMain] = useState<string | null>(null);
  const [backup1, setBackup1] = useState<string | null>(null);
  const [backup2, setBackup2] = useState<string | null>(null);

  const complete =
    name.trim().length > 0 &&
    main !== null &&
    backup1 !== null &&
    backup2 !== null;

  const slotValue = (modelId: string | null): TierModelValue | null =>
    modelId === null ? null : { kind: 'model', id: modelId };

  const slotOf = (modelId: string) => {
    const model = models.find((candidate) => candidate.id === modelId);
    return { provider: model?.provider ?? models[0].provider, modelId };
  };

  const mainFacts = models.find((candidate) => candidate.id === main);
  const backupReasons = backupDisabledReasons({ mainFacts, models });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('New custom tier')}</DialogTitle>
        <DialogDescription>
          {t(
            'A custom tier works exactly like the built-in ones: it runs its Main model and falls over to the backups. Backups must support everything the Main model supports.',
          )}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tier-name">{t('Name')}</Label>
          <Input
            id="tier-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('e.g. Legal drafting')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tier-description">{t('Description')}</Label>
          <Input
            id="tier-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('What is this tier best at?')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t('Main')}</Label>
          <TierModelPicker
            tiers={[]}
            models={models}
            value={slotValue(main)}
            onChange={(value) => value.kind === 'model' && setMain(value.id)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t('Backup 1')}</Label>
          <TierModelPicker
            tiers={[]}
            models={models}
            disabledModels={backupReasons}
            value={slotValue(backup1)}
            onChange={(value) => value.kind === 'model' && setBackup1(value.id)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t('Backup 2')}</Label>
          <TierModelPicker
            tiers={[]}
            models={models}
            disabledModels={backupReasons}
            value={slotValue(backup2)}
            onChange={(value) => value.kind === 'model' && setBackup2(value.id)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          disabled={!complete}
          onClick={() => {
            if (
              !complete ||
              main === null ||
              backup1 === null ||
              backup2 === null
            ) {
              return;
            }
            onCreate({
              id: `custom-${name.trim().toLowerCase().replace(/\s+/g, '-')}`,
              name: name.trim(),
              description: description.trim() || t('Custom tier'),
              builtIn: false,
              slots: {
                main: slotOf(main),
                backup1: slotOf(backup1),
                backup2: slotOf(backup2),
              },
            });
          }}
        >
          {t('Create tier')}
        </Button>
      </DialogFooter>
    </>
  );
}
