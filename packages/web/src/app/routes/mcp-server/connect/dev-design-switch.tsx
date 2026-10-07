import { useState } from 'react';

import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';

export function useDevDesign() {
  const [design, setDesign] = useState<DevDesign>(readDesign);
  return {
    design,
    setDesign: (next: DevDesign) => {
      setDesign(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        return;
      }
    },
  };
}

export function DevDesignSwitch({
  design,
  onChange,
}: {
  design: DevDesign;
  onChange: (design: DevDesign) => void;
}) {
  const { resolvedTheme, setPreferenceWithoutPersisting } = useTheme();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-xl border bg-panel p-3 shadow-lg">
      <span className="text-xs font-medium text-gray-11">
        Dev · Connect designs
      </span>
      <div className="flex gap-0.5 rounded-lg bg-gray-3 p-0.5">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={option.wip}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-7 whitespace-nowrap rounded-md px-2 text-xs font-medium transition-colors disabled:opacity-40',
              option.value === design
                ? 'bg-panel text-gray-12 shadow-sm'
                : 'text-gray-11 hover:text-gray-12',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex gap-0.5 rounded-lg bg-gray-3 p-0.5">
        {(['light', 'dark'] as const).map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={() => setPreferenceWithoutPersisting(theme)}
            className={cn(
              'h-7 flex-1 rounded-md px-2 text-xs font-medium capitalize transition-colors',
              resolvedTheme === theme
                ? 'bg-panel text-gray-12 shadow-sm'
                : 'text-gray-11 hover:text-gray-12',
            )}
          >
            {theme}
          </button>
        ))}
      </div>
    </div>
  );
}

function readDesign(): DevDesign {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const match = OPTIONS.find(
      (option) => option.value === value && !option.wip,
    );
    return match ? match.value : 'current';
  } catch {
    return 'current';
  }
}

const STORAGE_KEY = 'mcp-connect-dev-design';
const OPTIONS: { value: DevDesign; label: string; wip: boolean }[] = [
  { value: 'current', label: 'Current', wip: false },
  { value: 'a', label: 'A Grouped', wip: false },
  { value: 'b', label: 'B Wires', wip: false },
  { value: 'c', label: 'C Wires+grid', wip: false },
  { value: 'd', label: 'D Directory', wip: false },
  { value: 'e', label: 'E Split tiles', wip: false },
];

export type DevDesign = 'current' | 'a' | 'b' | 'c' | 'd' | 'e';
