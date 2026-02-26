import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { TimeUnit } from '../lib/impact-utils';

type TimeSavedFilterContentProps = {
  draftMin: string;
  onMinChange: (v: string) => void;
  unitMin: TimeUnit;
  onCycleUnitMin: () => void;
  draftMax: string;
  onMaxChange: (v: string) => void;
  unitMax: TimeUnit;
  onCycleUnitMax: () => void;
  onApply: () => void;
  /** When provided, renders a "Clear filter" link at the bottom of the popover */
  onClear?: () => void;
};

export function TimeSavedFilterContent({
  draftMin,
  onMinChange,
  unitMin,
  onCycleUnitMin,
  draftMax,
  onMaxChange,
  unitMax,
  onCycleUnitMax,
  onApply,
  onClear,
}: TimeSavedFilterContentProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm text-muted-foreground">{t('Minimum')}</Label>
        <div className="relative">
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={draftMin}
            onChange={(e) => onMinChange(e.target.value)}
            className="pr-12"
          />
          <button
            type="button"
            onClick={onCycleUnitMin}
            className="absolute bg-accent px-1.5 py-0.5 rounded-sm right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none"
          >
            {unitMin}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm text-muted-foreground">{t('Maximum')}</Label>
        <div className="relative">
          <Input
            type="number"
            min={0}
            placeholder="∞"
            value={draftMax}
            onChange={(e) => onMaxChange(e.target.value)}
            className="pr-12"
          />
          <button
            type="button"
            onClick={onCycleUnitMax}
            className="absolute bg-accent px-1.5 py-0.5 rounded-sm right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none"
          >
            {unitMax}
          </button>
        </div>
      </div>

      <Button onClick={onApply} className="w-full mt-1">
        {t('Apply')}
      </Button>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="w-full text-center text-sm text-primary hover:underline"
        >
          {t('Clear filter')}
        </button>
      )}
    </div>
  );
}
