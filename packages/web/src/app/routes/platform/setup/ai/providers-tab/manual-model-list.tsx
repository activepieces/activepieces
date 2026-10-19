import { AIProviderModelType, ProviderModelConfig } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus, X } from 'lucide-react';
import { useId, useState } from 'react';

import { Badge } from '@/components/ui/badge';
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
  suggestedModelIds = [],
  tiersByModel = new Map(),
  onChange,
}: {
  models: ProviderModelConfig[];
  suggestedModelIds?: string[];
  tiersByModel?: Map<string, string[]>;
  onChange: (models: ProviderModelConfig[]) => void;
}) {
  const suggestionListId = useId();
  const unusedSuggestions = suggestedModelIds.filter(
    (modelId) => !models.some((model) => model.modelId === modelId),
  );
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
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-6/60">
      <div className="flex items-center gap-2 p-3">
        <Input
          className="max-w-xs"
          list={suggestionListId}
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
        <datalist id={suggestionListId}>
          {unusedSuggestions.map((modelId) => (
            <option key={modelId} value={modelId} />
          ))}
        </datalist>
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
        <p className="border-t border-gray-6/60 p-4 text-sm text-gray-11">
          {t(
            'This provider cannot list models automatically — add the model ids you want to expose.',
          )}
        </p>
      ) : (
        <div className="flex flex-col border-t border-gray-6/60">
          {models.map((model) => (
            <div
              key={model.modelId}
              className="flex items-center gap-3 border-b border-gray-6/60 px-4 py-2.5 last:border-b-0"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-sm">
                {model.modelId}
              </span>
              {tiersByModel.has(model.modelId) && (
                <Badge variant="info" className="shrink-0">
                  {t('Used by {tiers}', {
                    tiers: tiersByModel.get(model.modelId)?.join(', '),
                  })}
                </Badge>
              )}
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
                className="rounded-md border border-gray-6 px-2 py-0.5 text-xs text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12"
              >
                {modelTypeLabel(model.modelType)}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={t('Remove')}
                disabled={tiersByModel.has(model.modelId)}
                onClick={() =>
                  onChange(
                    models.filter(
                      (current) => current.modelId !== model.modelId,
                    ),
                  )
                }
              >
                <X className="size-3.5" />
              </Button>
            </div>
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
