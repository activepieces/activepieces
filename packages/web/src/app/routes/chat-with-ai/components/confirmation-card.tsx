import { t } from 'i18next';
import { AlertTriangle } from 'lucide-react';

import { DynamicToolPart } from '@/features/chat/lib/chat-types';

export function isConfirmationTool(part: DynamicToolPart): boolean {
  return part.toolName === 'ap_confirm_action';
}

export function ConfirmationCard({
  toolPart,
  onConfirm,
}: {
  toolPart: DynamicToolPart;
  onConfirm: (text: string) => void;
}) {
  const input = toolPart.input as
    | { message?: string; actions?: Array<{ description: string; destructive: boolean }> }
    | undefined;

  const message = input?.message ?? t('Confirm this action?');
  const actions = input?.actions ?? [];
  const isWaiting = toolPart.state !== 'output-available' && toolPart.state !== 'output-error';

  return (
    <div className="my-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
          {actions.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {actions.map((action, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={action.destructive ? 'text-destructive' : ''}>
                    {action.destructive ? '⚠' : '•'} {action.description}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {isWaiting && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onConfirm('Yes, proceed')}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                {t('Confirm')}
              </button>
              <button
                onClick={() => onConfirm('No, cancel this')}
                className="px-3 py-1.5 text-xs font-medium rounded-md border hover:bg-muted transition-colors"
              >
                {t('Cancel')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
