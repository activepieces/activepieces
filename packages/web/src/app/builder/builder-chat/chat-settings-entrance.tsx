import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export function ChatSettingsEntrance({
  entrance,
  changedFieldNames,
  children,
}: {
  entrance: ChatSettingsEntranceKind;
  changedFieldNames: string[];
  children: React.ReactNode;
}) {
  const [entranceAtMount] = useState(entrance);
  const [fieldsAtMount] = useState(changedFieldNames);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (entranceAtMount === 'none' || fieldsAtMount.length === 0) {
      return;
    }
    const timers: number[] = [];
    fieldsAtMount.forEach((fieldName, index) => {
      timers.push(
        window.setTimeout(
          () => spotlightField({ container: containerRef.current, fieldName }),
          FIRST_FIELD_DELAY_MS + index * FIELD_STEP_MS,
        ),
      );
    });
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [entranceAtMount, fieldsAtMount]);

  return (
    <div
      ref={containerRef}
      className={cn('h-full', {
        'animate-in fade-in slide-in-from-right-8 duration-700 ease-out fill-mode-both':
          entranceAtMount === 'arrive',
        'chat-settings-flash':
          entranceAtMount === 'refresh' && fieldsAtMount.length === 0,
      })}
    >
      {children}
    </div>
  );
}

function spotlightField({
  container,
  fieldName,
  attempt = 0,
}: {
  container: HTMLDivElement | null;
  fieldName: string;
  attempt?: number;
}) {
  const field = container?.querySelector<HTMLElement>(
    `[data-field-name="${CSS.escape(fieldName)}"]`,
  );
  if (!field) {
    if (attempt < FIELD_LOOKUP_RETRIES) {
      window.setTimeout(
        () => spotlightField({ container, fieldName, attempt: attempt + 1 }),
        FIELD_LOOKUP_INTERVAL_MS,
      );
    }
    return;
  }
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  field.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'center',
  });
  field.animate(FIELD_GLOW_KEYFRAMES, {
    duration: reduceMotion ? 0 : FIELD_GLOW_MS,
    easing: 'ease-out',
  });
}

const FIELD_GLOW_KEYFRAMES: Keyframe[] = [
  {
    backgroundColor: 'var(--accent-3)',
    boxShadow: '0 0 0 2px var(--accent-8)',
    borderRadius: '8px',
  },
  {
    backgroundColor: 'transparent',
    boxShadow: '0 0 0 0 transparent',
    borderRadius: '8px',
  },
];
const FIELD_GLOW_MS = 2000;
const FIELD_LOOKUP_RETRIES = 6;
const FIELD_LOOKUP_INTERVAL_MS = 300;
const FIRST_FIELD_DELAY_MS = 750;
const FIELD_STEP_MS = 900;

export type ChatSettingsEntranceKind = 'arrive' | 'refresh' | 'none';
