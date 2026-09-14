import { AIProviderModelType, ProviderModelConfig } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ManualModelList({
  models,
  onChange,
}: {
  models: ProviderModelConfig[];
  onChange: (models: ProviderModelConfig[]) => void;
}) {
  const [draftId, setDraftId] = useState('');
  const [draftType, setDraftType] = useState<AIProviderModelType>(
    AIProviderModelType.TEXT,
  );
  const add = () => {
    const modelId = draftId.trim();
    if (
      modelId.length === 0 ||
      models.some((model) => model.modelId === modelId)
    ) {
      return;
    }
    onChange([
      ...models,
      { modelId, modelName: modelId, modelType: draftType },
    ]);
    setDraftId('');
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/60">
      <div className="flex items-center gap-2 p-3">
        <Input
          className="max-w-xs"
          value={draftId}
          onChange={(event) => setDraftId(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder={t('e.g. openai/gpt-4o')}
        />
        <Select
          value={draftType}
          onValueChange={(value) => setDraftType(modelTypeOf(value))}
        >
          <SelectTrigger className="w-28 shrink-0" aria-label={t('Model Type')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(AIProviderModelType).map((type) => (
              <SelectItem key={type} value={type}>
                {modelTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          {t('Add')}
        </Button>
      </div>
      {models.length === 0 ? (
        <p className="border-t border-border/60 p-4 text-sm text-muted-foreground">
          {t(
            'This provider cannot list models automatically — add the model ids you want to expose.',
          )}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5 border-t border-border/60 p-3">
          {models.map((model) => (
            <span
              key={model.modelId}
              className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-xs"
            >
              {model.modelId}
              <button
                type="button"
                title={t('Model Type')}
                onClick={() =>
                  onChange(
                    models.map((current) =>
                      current.modelId === model.modelId
                        ? { ...current, modelType: toggleModelType(current) }
                        : current,
                    ),
                  )
                }
                className="rounded bg-background px-1 py-px font-sans text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                {modelTypeLabel(model.modelType)}
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    models.filter(
                      (current) => current.modelId !== model.modelId,
                    ),
                  )
                }
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function modelTypeOf(value: string): AIProviderModelType {
  return value === AIProviderModelType.IMAGE
    ? AIProviderModelType.IMAGE
    : AIProviderModelType.TEXT;
}

function modelTypeLabel(modelType: AIProviderModelType): string {
  return modelType === AIProviderModelType.IMAGE ? t('Image') : t('Text');
}

function toggleModelType(model: ProviderModelConfig): AIProviderModelType {
  return model.modelType === AIProviderModelType.IMAGE
    ? AIProviderModelType.TEXT
    : AIProviderModelType.IMAGE;
}
