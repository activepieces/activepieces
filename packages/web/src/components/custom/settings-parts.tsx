import { Add01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import * as React from 'react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
  saveShortcut = false,
}: SaveBarProps) {
  const saveButton = React.useRef<HTMLButtonElement>(null);
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
        ref={saveButton}
        type="submit"
        loading={saving}
        disabled={invalid}
        keyboardShortcut={saveShortcut ? 'S' : undefined}
        onKeyboardShortcut={() => saveButton.current?.form?.requestSubmit()}
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
    const entries = splitChipEntries(draft);
    if (entries.length === 0 || adding) {
      return;
    }
    const fresh = entries.filter((entry) => !values.includes(entry));
    if (fresh.length === 0) {
      setError(t('Already in the list'));
      return;
    }
    const invalid = fresh
      .map((entry) => ({ entry, problem: validate?.(entry) ?? null }))
      .find(({ problem }) => problem !== null);
    if (invalid) {
      setError(
        entries.length === 1
          ? invalid.problem
          : t('{value}: {problem}', {
              value: invalid.entry,
              problem: invalid.problem,
            }),
      );
      return;
    }
    setError(null);
    setAdding(true);
    const added = await addInOrder({ entries: fresh, onAdd });
    setAdding(false);
    const remaining = fresh.filter((entry) => !added.includes(entry));
    setDraft(remaining.join(', '));
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
                  className="rounded-md text-gray-11 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-gray-8 focus-visible:outline-none disabled:opacity-50"
                  onClick={() => onRemove(value)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
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
            onPaste={(event) => {
              const pasted = event.clipboardData.getData('text');
              if (!CHIP_SEPARATOR.test(pasted.trim())) {
                return;
              }
              event.preventDefault();
              setDraft((current) =>
                [
                  ...splitChipEntries(current),
                  ...splitChipEntries(pasted),
                ].join(', '),
              );
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
          <HugeiconsIcon icon={Add01Icon} />
          {t('Add')}
        </Button>
      </form>
    </div>
  );
}

function splitChipEntries(text: string): string[] {
  return [
    ...new Set(
      text
        .split(CHIP_SEPARATOR)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  ];
}

async function addInOrder({
  entries,
  onAdd,
}: {
  entries: string[];
  onAdd: (value: string) => Promise<unknown> | void;
}): Promise<string[]> {
  const added: string[] = [];
  for (const entry of entries) {
    const ok = await Promise.resolve(onAdd(entry)).then(
      () => true,
      () => false,
    );
    if (!ok) {
      break;
    }
    added.push(entry);
  }
  return added;
}

const CHIP_SEPARATOR = /[\s,]+/;

export { SaveBar, DangerZone, CopyField, ChipListField, splitChipEntries };

export type SaveBarProps = {
  dirty: boolean;
  saving: boolean;
  invalid?: boolean;
  error?: string | null;
  onDiscard: () => void;
  saveLabel?: string;
  saveControl?: AdminControl;
  locked?: SaveBarLock;
  saveShortcut?: boolean;
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
