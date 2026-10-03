import { t } from 'i18next';
import { Plus, X } from 'lucide-react';
import * as React from 'react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function SaveBar({
  dirty,
  saving,
  onDiscard,
  saveLabel = t('Save'),
}: {
  dirty: boolean;
  saving: boolean;
  onDiscard: () => void;
  saveLabel?: string;
}) {
  if (!dirty) {
    return null;
  }
  return (
    <>
      <span className="flex-1 text-sm text-gray-11">
        {t('You have unsaved changes')}
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={saving}
        onClick={onDiscard}
      >
        {t('Discard')}
      </Button>
      <Button type="submit" loading={saving}>
        {saveLabel}
      </Button>
    </>
  );
}

function DangerZone({ actions }: { actions: DangerZoneAction[] }) {
  return (
    <Panel title={t('Danger zone')} flush>
      <SettingRows>
        {actions.map((action) => (
          <SettingRow
            key={action.title}
            title={action.title}
            description={action.description}
          >
            {action.control}
          </SettingRow>
        ))}
      </SettingRows>
    </Panel>
  );
}

function CopyField({
  label,
  value,
  help,
  className,
}: {
  label: string;
  value: string;
  help?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label className="text-gray-12">{label}</Label>
      <CopyToClipboardInput textToCopy={value} useInput={true} />
      {help && <p className="text-xs text-gray-11">{help}</p>}
    </div>
  );
}

function ChipListField({
  values,
  onAdd,
  onRemove,
  placeholder,
  emptyLabel,
  validate,
  mono = false,
  disabled = false,
}: {
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder: string;
  emptyLabel: string;
  validate?: (value: string) => string | null;
  mono?: boolean;
  disabled?: boolean;
}) {
  const [draft, setDraft] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const submit = () => {
    const value = draft.trim();
    if (value.length === 0) {
      return;
    }
    if (values.includes(value)) {
      setError(t('Already in the list'));
      return;
    }
    const problem = validate?.(value) ?? null;
    if (problem) {
      setError(problem);
      return;
    }
    onAdd(value);
    setDraft('');
    setError(null);
  };
  return (
    <div className="flex flex-col gap-3">
      {values.length === 0 ? (
        <p className="text-sm text-gray-11">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <li key={value}>
              <Badge
                variant="outline"
                className={cn('gap-1 pr-1', mono && 'font-mono')}
              >
                {value}
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={t('Remove {value}', { value })}
                  className="rounded-sm text-gray-11 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-accent-8 focus-visible:outline-none disabled:opacity-50"
                  onClick={() => onRemove(value)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex max-w-md items-start gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Input
            value={draft}
            disabled={disabled}
            placeholder={placeholder}
            aria-invalid={error !== null}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
          />
          {error && <p className="text-xs text-danger-11">{error}</p>}
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={disabled || draft.trim().length === 0}
        >
          <Plus />
          {t('Add')}
        </Button>
      </form>
    </div>
  );
}

export { SaveBar, DangerZone, CopyField, ChipListField };

export type DangerZoneAction = {
  title: string;
  description?: React.ReactNode;
  control: React.ReactNode;
};
