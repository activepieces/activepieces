import { t } from 'i18next';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ManualModelList({
  modelIds,
  onChange,
}: {
  modelIds: string[];
  onChange: (modelIds: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const value = draft.trim();
    if (value.length === 0 || modelIds.includes(value)) {
      return;
    }
    onChange([...modelIds, value]);
    setDraft('');
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/60">
      <div className="flex max-w-xs items-center gap-2 p-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder={t('e.g. openai/gpt-4o')}
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" />
          {t('Add')}
        </Button>
      </div>
      {modelIds.length === 0 ? (
        <p className="border-t border-border/60 p-4 text-sm text-muted-foreground">
          {t(
            'This provider cannot list models automatically — add the model ids you want to expose.',
          )}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5 border-t border-border/60 p-3">
          {modelIds.map((modelId) => (
            <span
              key={modelId}
              className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-xs"
            >
              {modelId}
              <button
                type="button"
                onClick={() =>
                  onChange(modelIds.filter((current) => current !== modelId))
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
