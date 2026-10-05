import { t } from 'i18next';
import { Plus, X } from 'lucide-react';
import * as React from 'react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

function SaveBar({
  dirty,
  saving,
  invalid = false,
  error,
  onDiscard,
  saveLabel = t('Save'),
  saveControl,
  locked,
}: SaveBarProps) {
  if (locked) {
    return dirty ? (
      <LockedSaveActions
        lock={locked}
        onDiscard={onDiscard}
        saving={saving}
        invalid={invalid}
        error={error}
        saveLabel={saveLabel}
        saveControl={saveControl}
      />
    ) : null;
  }
  if (!dirty && !error) {
    return null;
  }
  return (
    <>
      {error ? (
        <span role="alert" className="flex-1 text-sm text-danger-11">
          {error}
        </span>
      ) : (
        <StatusDot tone="warning" className="flex-1 text-gray-11">
          {t('You have unsaved changes')}
        </StatusDot>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={saving}
        onClick={onDiscard}
      >
        {t('Discard')}
      </Button>
      <Button
        type="submit"
        loading={saving}
        disabled={invalid}
        {...adminControl(saveControl)}
      >
        {saveLabel}
      </Button>
    </>
  );
}

function LockedSaveActions({
  lock,
  onDiscard,
  saving,
  invalid,
  error,
  saveLabel,
  saveControl,
}: {
  lock: SaveBarLock;
  onDiscard: () => void;
  saving: boolean;
  invalid: boolean;
  error?: string | null;
  saveLabel: string;
  saveControl?: AdminControl;
}) {
  return (
    <>
      {error ? (
        <span role="alert" className="flex-1 text-sm text-danger-11">
          {error}
        </span>
      ) : (
        <StatusDot tone="accent" className="flex-1 text-gray-11">
          {lock.message}
        </StatusDot>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={saving}
        onClick={onDiscard}
      >
        {t('Discard')}
      </Button>
      {lock.canSaveRest && (
        <Button
          type="submit"
          variant="outline"
          loading={saving}
          disabled={invalid}
          {...adminControl(saveControl)}
        >
          {saveLabel}
        </Button>
      )}
      {lock.upgradeAction}
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
  controlId,
}: {
  label: string;
  value: string;
  help?: React.ReactNode;
  className?: string;
  controlId?: AdminControl;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label className="text-gray-12">{label}</Label>
      <CopyToClipboardInput
        textToCopy={value}
        useInput={true}
        controlId={controlId}
      />
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
  submitControl,
}: {
  values: string[];
  onAdd: (value: string) => Promise<unknown> | void;
  onRemove: (value: string) => void;
  placeholder: string;
  emptyLabel: string;
  validate?: (value: string) => string | null;
  mono?: boolean;
  disabled?: boolean;
  submitControl?: AdminControl;
}) {
  const [draft, setDraft] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const submit = async () => {
    const value = draft.trim();
    if (value.length === 0 || adding) {
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
    setError(null);
    setAdding(true);
    const added = await Promise.resolve(onAdd(value)).then(
      () => true,
      () => false,
    );
    setAdding(false);
    if (added) {
      setDraft((current) => (current.trim() === value ? '' : current));
    }
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
                  className="rounded-md text-gray-11 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-accent-8 focus-visible:outline-none disabled:opacity-50"
                  {...adminControl(submitControl)}
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
          void submit();
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
          loading={adding}
          disabled={disabled || draft.trim().length === 0}
          {...adminControl(submitControl)}
        >
          <Plus />
          {t('Add')}
        </Button>
      </form>
    </div>
  );
}

export { SaveBar, DangerZone, CopyField, ChipListField };

export type SaveBarProps = {
  dirty: boolean;
  saving: boolean;
  invalid?: boolean;
  error?: string | null;
  onDiscard: () => void;
  saveLabel?: string;
  saveControl?: AdminControl;
  locked?: SaveBarLock;
};

export type SaveBarLock = {
  message: string;
  upgradeAction: React.ReactNode;
  canSaveRest?: boolean;
};

export type DangerZoneAction = {
  title: string;
  description?: React.ReactNode;
  control: React.ReactNode;
};
