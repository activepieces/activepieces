import { t } from 'i18next';
import { Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { ZapIcon, ZapIconHandle } from '@/components/icons/zap';
import { cn } from '@/lib/utils';

import { passwordRules } from '../utils/password-validation-utils';

// Color per step: 1/5 = red, 2/5 = orange, 3/5 = yellow, 4/5 = violet, 5/5 = purple
const STEP_COLORS = ['#ef4444', '#f97316', '#eab308', '#c084fc', '#a855f7'];

function getBoltColor(passedCount: number) {
  if (passedCount === 0) return undefined;
  return STEP_COLORS[passedCount - 1];
}

const PasswordStrengthBolt = ({ password }: { password: string }) => {
  const results = passwordRules.map((rule) => ({
    label: rule.label,
    passed: rule.condition(password),
  }));
  const passedCount = results.filter((r) => r.passed).length;
  const total = results.length;
  const fillPercent = total === 0 ? 0 : (passedCount / total) * 100;
  const isComplete = passedCount === total && total > 0;
  const boltColor = getBoltColor(passedCount);

  const glowRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<ZapIconHandle>(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    if (isComplete) {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = 'boltGlow 0.6s ease-in forwards';
      iconRef.current?.startAnimation();
    } else {
      el.style.animation = '';
    }
  }, [isComplete]);

  return (
    <div className="relative group flex items-center justify-center">
      <div ref={glowRef}>
        <ZapIcon
          ref={iconRef}
          size={20}
          fillColor={boltColor}
          fillPercent={fillPercent}
        />
      </div>

      {/* Hover tooltip */}
      <div
        className={cn(
          'absolute bottom-full right-0 mb-2.5 w-52',
          'bg-popover border border-border rounded-md shadow-lg p-3',
          'hidden group-hover:block z-50 pointer-events-none',
        )}
      >
        <p className="text-xs font-semibold text-foreground mb-2">
          {t('Password requirements')}
        </p>
        <div className="flex flex-col gap-1.5">
          {results.map((rule) => (
            <div key={rule.label} className="flex items-center gap-2 text-xs">
              {rule.passed ? (
                <Check className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
              )}
              <span
                className={cn(
                  rule.passed ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {rule.label}
              </span>
            </div>
          ))}
        </div>
        {/* Downward-pointing arrow */}
        <div className="absolute top-full right-2.5 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border" />
      </div>
    </div>
  );
};

PasswordStrengthBolt.displayName = 'PasswordStrengthBolt';

export { PasswordStrengthBolt };
