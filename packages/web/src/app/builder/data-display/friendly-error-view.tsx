import { FriendlyPieceError, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import {
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  Hourglass,
  KeyRound,
  Search,
  ServerCrash,
  ShieldOff,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import { JsonViewer } from '@/components/custom/json-viewer';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

import { CopyAiPromptButton } from './copy-ai-prompt';
import { ErrorExplanationContext } from './explanation-prompt';

type FriendlyErrorViewProps = {
  error: FriendlyPieceError;
  explanationContext?: ErrorExplanationContext;
  pieceDisplayName?: string;
  className?: string;
};

const FriendlyErrorView = ({
  error,
  explanationContext,
  pieceDisplayName,
  className,
}: FriendlyErrorViewProps) => {
  const [technicalDetailsOpen, setTechnicalDetailsOpen] = useState(false);
  const { status } = error;
  const { Icon, headline, hint, tone } = getStatusPresentation(status);
  const isHttpError = !isNil(status);
  const messageText = pickDisplayMessage(error);
  const showMessage = !isNil(messageText) && messageText.length > 0;
  const messageLabel = isHttpError
    ? pieceDisplayName
      ? t('Response from {pieceDisplayName}', { pieceDisplayName })
      : t('What the service said')
    : t('Error message');
  const technicalPayload = stripInternalMarker(error);

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
      {showMessage && (
        <div className="px-4 py-3 border-t border-border bg-background flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {messageLabel}
          </span>
          <p className="text-sm text-foreground break-words whitespace-pre-wrap">
            {messageText}
          </p>
        </div>
      )}
      {explanationContext && (
        <CopyAiPromptButton error={error} context={explanationContext} />
      )}
      <Collapsible
        open={technicalDetailsOpen}
        onOpenChange={setTechnicalDetailsOpen}
        className="border-t border-border bg-background"
      >
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <span className="flex-1 text-left">{t('Technical Details')}</span>
          <ChevronDown
            className={cn(
              'size-3.5 transition-transform',
              technicalDetailsOpen && 'rotate-180',
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="px-4 pb-3">
            {isNil(error.raw) ? (
              <JsonViewer
                json={technicalPayload}
                title={t('Error')}
                hideHeader
                hideDownload
                className="border border-solid border-dividers rounded-md"
              />
            ) : (
              <pre className="m-0 max-h-96 overflow-auto rounded-md border border-solid border-dividers bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-foreground/80">
                {error.raw}
              </pre>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

const stripInternalMarker = (
  error: FriendlyPieceError,
): Record<string, unknown> => {
  const entries = Object.entries(error).filter(
    ([key]) => key !== '__apErrorVersion',
  );
  return Object.fromEntries(entries);
};

const pickDisplayMessage = (error: FriendlyPieceError): string | undefined => {
  const candidates = [error.apiMessage, error.message];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
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
        'The connected account does not have permission for this action.',
      ),
      tone: DESTRUCTIVE_TONE,
    };
  }
  if (status === 404) {
    return {
      Icon: Search,
      headline: t('Resource not found'),
      hint: t(
        'The service could not find the requested resource. Double-check the IDs or names in the step input.',
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
