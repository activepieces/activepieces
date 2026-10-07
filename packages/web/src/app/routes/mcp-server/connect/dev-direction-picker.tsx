import { useState } from 'react';

import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';

import { ConnectStateOverride } from './use-connect-home';

export function useDevDirection() {
  const [settings, setSettings] = useState<DevSettings>(readSettings);
  const update = (next: Partial<DevSettings>) => {
    const merged = { ...settings, ...next };
    setSettings(merged);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      return;
    }
  };
  return { settings, update };
}

export function DevDirectionPicker({
  settings,
  onChange,
}: {
  settings: DevSettings;
  onChange: (next: Partial<DevSettings>) => void;
}) {
  const { resolvedTheme, setPreferenceWithoutPersisting } = useTheme();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-xl border bg-panel p-3 shadow-lg">
      <span className="text-xs font-medium text-gray-11">
        Dev · Connect tab
      </span>
      <Segmented
        value={settings.direction}
        options={[
          { value: 'logos', label: 'A Logos' },
          { value: 'transcript', label: 'B Transcript' },
          { value: 'hub', label: 'C Hub' },
        ]}
        onChange={(direction) => onChange({ direction })}
      />
      <Segmented
        value={settings.state}
        options={[
          { value: 'auto', label: 'Real' },
          { value: 'first', label: 'First visit' },
          { value: 'connected', label: 'Connected' },
        ]}
        onChange={(state) => onChange({ state })}
      />
      <Segmented
        value={resolvedTheme}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        onChange={(theme) => setPreferenceWithoutPersisting(theme)}
      />
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-lg bg-gray-3 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'h-7 flex-1 whitespace-nowrap rounded-md px-2 text-xs font-medium transition-colors',
            option.value === value
              ? 'bg-panel text-gray-12 shadow-sm'
              : 'text-gray-11 hover:text-gray-12',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function readSettings(): DevSettings {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '');
    if (isDevSettings(parsed)) return parsed;
  } catch {
    return DEFAULT_SETTINGS;
  }
  return DEFAULT_SETTINGS;
}

function isDevSettings(value: unknown): value is DevSettings {
  return (
    typeof value === 'object' &&
    value !== null &&
    'direction' in value &&
    'state' in value &&
    DIRECTIONS.some((direction) => direction === value.direction) &&
    STATES.some((state) => state === value.state)
  );
}

const STORAGE_KEY = 'mcp-connect-dev-take';
const DIRECTIONS: ConnectDirection[] = ['logos', 'transcript', 'hub'];
const STATES: ConnectStateOverride[] = ['auto', 'first', 'connected'];
const DEFAULT_SETTINGS: DevSettings = { direction: 'logos', state: 'auto' };

export type ConnectDirection = 'logos' | 'transcript' | 'hub';

export type DevSettings = {
  direction: ConnectDirection;
  state: ConnectStateOverride;
};
