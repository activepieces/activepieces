import { FriendlyPieceError, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import {
  AlertOctagon,
  AlertTriangle,
  ChevronRight,
  Hourglass,
  KeyRound,
  Search,
  ServerCrash,
  ShieldOff,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { DataDisplayTabs } from './data-display-tabs';

type FriendlyErrorViewProps = {
  error: FriendlyPieceError;
  className?: string;
};

const FriendlyErrorView = ({ error, className }: FriendlyErrorViewProps) => {
  const { status } = error;
  const { Icon, headline, hint, tone } = getStatusPresentation(status);
  const detailPayload = buildDetailPayload(error);
  const hasDetails = Object.keys(detailPayload).length > 0;

  return (
    <div
      className={cn(
        'flex flex-col rounded-md border border-border overflow-hidden',
        className,
      )}
    >
      <div className={cn('flex items-start gap-3 px-4 py-3', tone.headerBg)}>
        <Icon className={cn('size-5 mt-0.5 shrink-0', tone.iconColor)} />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-medium', tone.headlineColor)}>
              {headline}
            </span>
            {!isNil(status) && (
              <Badge
                variant="outline"
                className={cn('text-xs', tone.badgeColor)}
              >
                {t('HTTP {status}', { status })}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {hint}
          </p>
        </div>
      </div>
      {error.apiMessage && (
        <div className="px-4 py-3 border-t border-border bg-background flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('What the service said')}
          </span>
          <p className="text-sm text-foreground break-words whitespace-pre-wrap">
            {error.apiMessage}
          </p>
        </div>
      )}
      {!error.apiMessage && error.message && isNil(status) && (
        <div className="px-4 py-3 border-t border-border bg-background flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('Error message')}
          </span>
          <p className="text-sm text-foreground break-words whitespace-pre-wrap">
            {error.message}
          </p>
        </div>
      )}
      {hasDetails && <CollapsibleDetails payload={detailPayload} />}
    </div>
  );
};

type CollapsibleDetailsProps = {
  payload: Record<string, unknown>;
};

const CollapsibleDetails = ({ payload }: CollapsibleDetailsProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
        aria-expanded={expanded}
      >
        <ChevronRight
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
        />
        <span className="font-medium text-foreground">
          {t('Technical details')}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-3 py-3">
          <DataDisplayTabs data={payload} title={t('Technical details')} />
        </div>
      )}
    </div>
  );
};

const buildDetailPayload = (
  error: FriendlyPieceError,
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  if (!isNil(error.errorName)) {
    payload.errorName = error.errorName;
  }
  if (
    !isNil(error.requestUrl) ||
    !isNil(error.requestMethod) ||
    !isNil(error.requestBody)
  ) {
    payload.request = {
      ...(error.requestMethod ? { method: error.requestMethod } : {}),
      ...(error.requestUrl ? { url: error.requestUrl } : {}),
      ...(isNil(error.requestBody) ? {} : { body: error.requestBody }),
    };
  }
  if (
    !isNil(error.status) ||
    !isNil(error.responseBody) ||
    !isNil(error.responseHeaders)
  ) {
    payload.response = {
      ...(isNil(error.status) ? {} : { status: error.status }),
      ...(isNil(error.responseHeaders)
        ? {}
        : { headers: error.responseHeaders }),
      ...(isNil(error.responseBody) ? {} : { body: error.responseBody }),
    };
  }
  return payload;
};

type StatusPresentation = {
  Icon: LucideIcon;
  headline: string;
  hint: string;
  tone: StatusTone;
};

type StatusTone = {
  headerBg: string;
  iconColor: string;
  headlineColor: string;
  badgeColor: string;
};

const DESTRUCTIVE_TONE: StatusTone = {
  headerBg: 'bg-destructive/10',
  iconColor: 'text-destructive',
  headlineColor: 'text-destructive',
  badgeColor: 'border-destructive/40 text-destructive bg-destructive/5',
};

const WARNING_TONE: StatusTone = {
  headerBg: 'bg-warning/10',
  iconColor: 'text-warning',
  headlineColor: 'text-foreground',
  badgeColor: 'border-warning/40 text-warning bg-warning/5',
};

const getStatusPresentation = (
  status: number | undefined,
): StatusPresentation => {
  if (isNil(status)) {
    return {
      Icon: AlertOctagon,
      headline: t('Step failed'),
      hint: t(
        'The step did not complete successfully. Check the step configuration, or contact support if the issue persists.',
      ),
      tone: DESTRUCTIVE_TONE,
    };
  }
  if (status === 401) {
    return {
      Icon: KeyRound,
      headline: t('Authentication failed'),
      hint: t(
        'The connected account could not authenticate with the service. Try reconnecting the account, or check that the credentials have not expired or been revoked.',
      ),
      tone: DESTRUCTIVE_TONE,
    };
  }
  if (status === 403) {
    return {
      Icon: ShieldOff,
      headline: t('Permission denied'),
      hint: t(
        "The connected account does not have permission for this action. Verify the account's role and permissions for this integration, and check any optional safety toggles on the step (for example, a built-in sanitize / safe-mode setting) — they may need to be disabled for accounts without administrative scope.",
      ),
      tone: DESTRUCTIVE_TONE,
    };
  }
  if (status === 404) {
    return {
      Icon: Search,
      headline: t('Resource not found'),
      hint: t(
        'The service could not find the requested resource. Double-check the IDs or names in the step input — the resource may have been deleted, moved, or is not visible to this account.',
      ),
      tone: WARNING_TONE,
    };
  }
  if (status === 408 || status === 504) {
    return {
      Icon: Hourglass,
      headline: t('Request timed out'),
      hint: t(
        'The service did not respond in time. This is usually a temporary issue — try the step again in a few moments.',
      ),
      tone: WARNING_TONE,
    };
  }
  if (status === 429) {
    return {
      Icon: Hourglass,
      headline: t('Too many requests'),
      hint: t(
        'The service is rate-limiting this account. Wait a few minutes and try again, or reduce how frequently this flow runs.',
      ),
      tone: WARNING_TONE,
    };
  }
  if (status >= 500) {
    return {
      Icon: ServerCrash,
      headline: t('The service is unavailable'),
      hint: t(
        "The service reported an internal error. This isn't an issue with your configuration — try again later, and check the service's status page if it persists.",
      ),
      tone: WARNING_TONE,
    };
  }
  if (status === 400 || status === 422) {
    return {
      Icon: AlertTriangle,
      headline: t('The request was rejected'),
      hint: t(
        'The service rejected the request. Review the step input and verify each field matches what the service expects.',
      ),
      tone: DESTRUCTIVE_TONE,
    };
  }
  if (status >= 400 && status < 500) {
    return {
      Icon: AlertTriangle,
      headline: t('The request was rejected'),
      hint: t(
        'The service rejected the request. Review the step input and the message below for details.',
      ),
      tone: DESTRUCTIVE_TONE,
    };
  }
  return {
    Icon: XCircle,
    headline: t('Step failed'),
    hint: t(
      'The step did not complete successfully. Check the step configuration and the message below.',
    ),
    tone: DESTRUCTIVE_TONE,
  };
};

FriendlyErrorView.displayName = 'FriendlyErrorView';

export { FriendlyErrorView };
