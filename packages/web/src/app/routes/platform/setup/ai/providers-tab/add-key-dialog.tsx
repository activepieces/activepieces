import { AIProviderName } from '@activepieces/core-utils';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';

export function AddKeyDialog({
  open,
  onOpenChange,
  defaultProvider,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProvider?: AIProviderName;
  onCreate: (input: { provider: AIProviderName; name: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AddKeyForm
          key={open ? defaultProvider ?? 'any' : 'closed'}
          defaultProvider={defaultProvider}
          onCreate={onCreate}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddKeyForm({
  defaultProvider,
  onCreate,
  onCancel,
}: {
  defaultProvider?: AIProviderName;
  onCreate: (input: { provider: AIProviderName; name: string }) => void;
  onCancel: () => void;
}) {
  const [provider, setProvider] = useState<AIProviderName | undefined>(
    defaultProvider,
  );
  const [name, setName] = useState(
    defaultProvider ? displayNameOf(defaultProvider) ?? '' : '',
  );

  const canCreate = provider !== undefined && name.trim().length > 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Add key')}</DialogTitle>
        <DialogDescription>
          {t(
            'Connect a provider with an API key. You can add more than one key per provider.',
          )}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label>{t('Provider')}</Label>
          <Select
            value={provider}
            onValueChange={(selected) => {
              const next = selected as AIProviderName;
              setProvider(next);
              if (name.trim().length === 0) {
                setName(displayNameOf(next) ?? '');
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Select provider')} />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_AI_PROVIDERS.map((info) => (
                <SelectItem key={info.provider} value={info.provider}>
                  <div className="flex items-center gap-2">
                    {info.logoUrl && (
                      <img
                        src={info.logoUrl}
                        alt={info.name}
                        className="size-4 object-contain"
                      />
                    )}
                    <span>{info.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t('Key name')}</Label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('e.g. Anthropic – Prod')}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {t('Cancel')}
        </Button>
        <Button
          disabled={!canCreate}
          onClick={() => {
            if (provider !== undefined && name.trim().length > 0) {
              onCreate({ provider, name: name.trim() });
            }
          }}
        >
          {t('Add key')}
        </Button>
      </DialogFooter>
    </>
  );
}

function displayNameOf(provider: AIProviderName): string | undefined {
  return SUPPORTED_AI_PROVIDERS.find((info) => info.provider === provider)
    ?.name;
}
