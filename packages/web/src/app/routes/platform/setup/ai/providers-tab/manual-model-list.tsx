import { AIProviderModelType, ProviderModelConfig } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { Panel } from '@/components/custom/panel';
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
    <Panel flush>
      <div className="flex items-center gap-3 p-5">
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
        <Button type="button" variant="outline" onClick={add}>
          <Plus />
          {t('Add')}
        </Button>
      </div>
      {models.length === 0 ? (
        <p className="border-t border-gray-6 p-5 text-sm text-gray-11">
          {t(
            'This provider cannot list models automatically — add the model ids you want to expose.',
          )}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 border-t border-gray-6 p-5">
          {models.map((model) => (
            <span
              key={model.modelId}
              className="flex h-8 items-center gap-2 rounded-lg bg-gray-3 px-2 font-mono text-sm"
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
                className="rounded-md bg-gray-1 px-1 py-px font-sans text-sm text-gray-11 transition-colors hover:text-gray-12"
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
                className="text-gray-11 transition-colors hover:text-gray-12"
              >
                <X className="size-4" />
              </button>
            </span>
          ))}
        </div>
      )}
    </Panel>
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
