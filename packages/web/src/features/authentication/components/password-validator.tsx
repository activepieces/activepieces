import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';

import { ZapIcon, ZapIconHandle } from '@/components/icons/zap';
import { cn } from '@/lib/utils';

import { passwordRules } from '../utils/password-validation-utils';

const STEP_COLORS = [
  'var(--danger-11)',
  'var(--warning-11)',
  'var(--swatch-6-mark)',
  'var(--accent-11)',
  'var(--success-11)',
];

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
    <div className="flex items-center justify-center">
      <div ref={glowRef}>
        <ZapIcon
          ref={iconRef}
          size={20}
          fillColor={boltColor}
          fillPercent={fillPercent}
        />
      </div>
    </div>
  );
};

PasswordStrengthBolt.displayName = 'PasswordStrengthBolt';

const PasswordRequirementsList = ({
  password,
  isSubmitted,
}: {
  password: string;
  isSubmitted: boolean;
}) => {
  const [hasReachedMin, setHasReachedMin] = useState(false);

  useEffect(() => {
    if (password.length >= 8) {
      setHasReachedMin(true);
    }
  }, [password]);

  const isOverMaxLength = password.length > 64;
  const isUnderAfterReaching = hasReachedMin && password.length < 8;
  const results = passwordRules.map((rule, index) => ({
    label: rule.label,
    passed: rule.condition(password),
    immediateError: index === 0 && (isOverMaxLength || isUnderAfterReaching),
  }));

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      {results.map((rule) => {
        const isError = rule.immediateError || (isSubmitted && !rule.passed);
        return (
          <div key={rule.label} className="flex items-center gap-1.5 text-sm">
            <div
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                rule.passed
                  ? 'bg-success-11'
                  : isError
                  ? 'bg-danger-11'
                  : 'bg-gray-8',
              )}
            />
            <span className="text-gray-12">{t(rule.label)}</span>
          </div>
        );
      })}
    </div>
  );
};

PasswordRequirementsList.displayName = 'PasswordRequirementsList';

export { PasswordStrengthBolt, PasswordRequirementsList };
