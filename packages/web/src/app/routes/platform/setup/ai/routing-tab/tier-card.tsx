import { t } from 'i18next';
import { CircleCheck, Info, Layers, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Badge } from '@/components/ui/badge';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  onDetailsChange,
}: {
  tier: MockTier;
  models: ModelFacts[];
  onSlotChange: (change: { slotKey: SlotKey; modelId: string }) => void;
  onDelete?: () => void;
  onDetailsChange?: (details: { name: string; description: string }) => void;
}) {
  const [showReplaceNote, setShowReplaceNote] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const mainFacts = models.find(
    (model) => model.id === tier.slots.main.modelId,
  );
  const backupReasons = backupDisabledReasons({ mainFacts, models });

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
    <div className="group flex flex-col rounded-lg border bg-card">
      <div className="flex items-center gap-2 p-4 pb-3">
        <TierCardIcon tierId={tier.id} />
        <p className="text-sm font-medium leading-none">{tier.name}</p>
        {!tier.builtIn && (
          <Badge
            variant="outline"
            className="border-primary/25 bg-primary/5 text-primary"
          >
            {t('Custom')}
          </Badge>
        )}
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {tier.description}
        </p>
        {!tier.builtIn && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            {onDetailsChange && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {onDelete && (
              <ConfirmationDeleteDialog
                title={t('Delete custom tier')}
                message={t(
                  'Anything still using this tier falls back to the default tier. Flows keep working.',
                )}
                entityName={tier.name}
                mutationFn={async () => onDelete()}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </ConfirmationDeleteDialog>
            )}
          </div>
        )}
      </div>
      {onDetailsChange && (
        <EditTierDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          tier={tier}
          onSave={onDetailsChange}
        />
      )}
      <div className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">{t('Model')}</span>
          <TierModelPicker
            tiers={[]}
            models={models}
            value={{ kind: 'model', id: tier.slots.main.modelId }}
            onChange={(value) => handleChange({ slotKey: 'main', value })}
          />
          {showReplaceNote && (
            <p className="flex items-center gap-1.5 text-xs text-success-700 dark:text-success-300">
              <CircleCheck className="size-3.5 shrink-0" />
              {t('Everything on this tier switched — flows keep working.')}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium">
            {t('Fallbacks')}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 cursor-default text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px]">
                {t(
                  'Tried in order when the model’s provider fails. A fallback must support everything the model supports — others are grayed out.',
                )}
              </TooltipContent>
            </Tooltip>
          </span>
          {BACKUP_KEYS.map((slotKey, index) => {
            const slot = tier.slots[slotKey];
            return (
              <div key={slotKey} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-4 text-center text-xs text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <TierModelPicker
                      compact
                      tiers={[]}
                      models={models}
                      disabledModels={backupReasons}
                      value={{ kind: 'model', id: slot.modelId }}
                      onChange={(value) => handleChange({ slotKey, value })}
                    />
                  </div>
                </div>
                {slot.providerDeleted && (
                  <div className="flex items-center gap-2">
                    <span className="w-4" />
                    <p className="text-xs text-destructive">
                      {t('This provider was removed — skipped at run time.')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EditTierDialog({
  open,
  onOpenChange,
  tier,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: MockTier;
  onSave: (details: { name: string; description: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <EditTierForm
          key={open ? tier.id : 'closed'}
          tier={tier}
          onSave={(details) => {
            onSave(details);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditTierForm({
  tier,
  onSave,
}: {
  tier: MockTier;
  onSave: (details: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState(tier.name);
  const [description, setDescription] = useState(tier.description);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Edit tier')}</DialogTitle>
        <DialogDescription>
          {t('Rename this tier — its models and fallbacks stay unchanged.')}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-tier-name">{t('Name')}</Label>
          <Input
            id="edit-tier-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-tier-description">{t('Description')}</Label>
          <Input
            id="edit-tier-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          disabled={name.trim().length === 0}
          onClick={() =>
            onSave({ name: name.trim(), description: description.trim() })
          }
        >
          {t('Save')}
        </Button>
      </DialogFooter>
    </>
  );
}

function TierCardIcon({ tierId }: { tierId: string }) {
  const builtIn = Object.entries(TIER_CONFIG).find(([key]) => key === tierId);
  const Icon = builtIn ? builtIn[1].icon : Layers;
  return <Icon className="size-4 shrink-0 text-muted-foreground" />;
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
      reasons[candidate.id] = t('Can’t generate images like the main model');
      continue;
    }
    if (mainFacts.vision && !candidate.vision) {
      reasons[candidate.id] = t('Can’t read images like the main model');
      continue;
    }
    if (mainFacts.embeddings && !candidate.embeddings) {
      reasons[candidate.id] = t('No embeddings, unlike the main model');
    }
  }
  return reasons;
}

const BACKUP_KEYS = ['backup1', 'backup2'] as const;

export const SLOT_KEYS = ['main', 'backup1', 'backup2'] as const;

export type SlotKey = (typeof SLOT_KEYS)[number];
