import { QueryKey } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { api } from '@/lib/api';

export function showQueryErrorToast({
  queryKey,
  error,
}: {
  queryKey: QueryKey;
  error: unknown;
}) {
  renderQueryErrorToast({ queryKey, error, expanded: false });
}

function renderQueryErrorToast({
  queryKey,
  error,
  expanded,
}: {
  queryKey: QueryKey;
  error: unknown;
  expanded: boolean;
}) {
  toast.error(t('Failed to load data'), {
    id: QUERY_ERROR_TOAST_ID,
    duration: expanded ? Infinity : 5000,
    closeButton: expanded,
    classNames: {
      toast: 'items-start!',
      icon: 'mt-0.5',
    },
    description: (
      <QueryErrorToastBody
        details={formatDetails({ queryKey, error })}
        expanded={expanded}
        onToggle={(next) =>
          renderQueryErrorToast({ queryKey, error, expanded: next })
        }
      />
    ),
  });
}

function QueryErrorToastBody({
  details,
  expanded,
  onToggle,
}: {
  details: string;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span>{t('Please refresh the page to try again.')}</span>
      <details
        open={expanded}
        onToggle={(event) => {
          const next = event.currentTarget.open;
          if (next !== expanded) {
            onToggle(next);
          }
        }}
      >
        <summary className="cursor-pointer select-none text-xs opacity-75 hover:opacity-100">
          {t('Technical details')}
        </summary>
        <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-sm bg-muted p-2 text-[11px] leading-snug text-muted-foreground">
          {details}
        </pre>
      </details>
    </div>
  );
}

function formatDetails({
  queryKey,
  error,
}: {
  queryKey: QueryKey;
  error: unknown;
}) {
  return JSON.stringify(
    {
      queryKey,
      details: api.isError(error) ? error.response?.data : String(error),
    },
    null,
    2,
  );
}

const QUERY_ERROR_TOAST_ID = 'query-error';
