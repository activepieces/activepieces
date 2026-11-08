import { t } from 'i18next';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { ChatStatus } from './chat-status-utils';

export function ChatStatusIcon({
  status,
  label,
  decorative = false,
  className,
}: ChatStatusIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label ?? statusLabel(status)}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        'size-3.5 shrink-0',
        status === 'working' && 'motion-safe:animate-spin',
        className,
      )}
    >
      <StatusGlyph status={status} />
    </svg>
  );
}

export function ChatStatusText({ status, children }: ChatStatusTextProps) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <ChatStatusIcon status={status} decorative />
      <span
        className={cn(
          'text-xs font-medium @max-chat-narrow/chat:sr-only',
          TEXT_CLASS[status],
        )}
      >
        {children ?? statusLabel(status)}
      </span>
    </span>
  );
}

function StatusGlyph({ status }: { status: ChatStatus }) {
  switch (status) {
    case 'working':
      return (
        <>
          <circle
            cx="8"
            cy="8"
            r="6.25"
            fill="none"
            strokeWidth="1.75"
            className="stroke-accent-4"
          />
          <path
            d="M8 1.75a6.25 6.25 0 0 1 6.25 6.25"
            fill="none"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="stroke-accent-10"
          />
        </>
      );
    case 'needs-you':
      return (
        <>
          <circle
            cx="8"
            cy="8"
            r="6.25"
            fill="none"
            strokeWidth="1.75"
            className="stroke-accent-10"
          />
          <circle cx="8" cy="8" r="2.5" className="fill-accent-10" />
        </>
      );
    case 'done':
      return (
        <>
          <circle cx="8" cy="8" r="7" className="fill-success-9" />
          <path
            d="M5 8.2l2 2 4-4.2"
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-on-success"
          />
        </>
      );
    case 'failed':
      return (
        <>
          <circle cx="8" cy="8" r="7" className="fill-danger-9" />
          <path
            d="M8 4.6v4.2"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="stroke-on-danger"
          />
          <circle cx="8" cy="11.2" r="1" className="fill-on-danger" />
        </>
      );
    case 'stopped':
      return (
        <>
          <circle cx="8" cy="8" r="7" className="fill-gray-9" />
          <rect
            x="5.5"
            y="5.5"
            width="5"
            height="5"
            rx="1"
            className="fill-gray-1"
          />
        </>
      );
  }
}

function statusLabel(status: ChatStatus): string {
  switch (status) {
    case 'working':
      return t('Working');
    case 'needs-you':
      return t('Needs you');
    case 'done':
      return t('Done');
    case 'failed':
      return t('Failed');
    case 'stopped':
      return t('Stopped');
  }
}

const TEXT_CLASS: Record<ChatStatus, string> = {
  working: 'text-accent-11',
  'needs-you': 'text-accent-11',
  done: 'text-success-11',
  failed: 'text-danger-11',
  stopped: 'text-gray-11',
};

type ChatStatusIconProps = {
  status: ChatStatus;
  label?: string;
  decorative?: boolean;
  className?: string;
};

type ChatStatusTextProps = {
  status: ChatStatus;
  children?: ReactNode;
};
