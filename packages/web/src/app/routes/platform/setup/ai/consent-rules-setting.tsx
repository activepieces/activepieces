import {
  ChatConsentDecision,
  ChatConsentOverridableKind,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ListChecks, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Toggle } from '@/components/ui/toggle';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { CONSENT_RULE_ROWS, consentRules } from './lib/consent-rules';

const DECISIONS: { value: ChatConsentDecision; label: string }[] = [
  { value: 'ask', label: 'Ask' },
  { value: 'allow', label: 'Allow' },
  { value: 'deny', label: 'Deny' },
];

const CONFIRM_ALLOW_KINDS: ReadonlySet<ChatConsentOverridableKind> = new Set([
  'financial',
  'destructive',
]);

const ALLOW_ON_CLASSES =
  'data-[state=on]:bg-warning-100 data-[state=on]:text-warning-800 dark:data-[state=on]:bg-warning-900/40 dark:data-[state=on]:text-warning-200';

export function ChatConsentRulesSetting() {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const [saving, setSaving] = useState(false);
  const [confirmAllowKind, setConfirmAllowKind] =
    useState<ChatConsentOverridableKind | null>(null);
  const settings = platform.chatConsentPolicy;
  const allowedRows = CONSENT_RULE_ROWS.filter(
    (row) => consentRules.ruleFor({ settings, kind: row.kind }) === 'allow',
  );
  const confirmRow = CONSENT_RULE_ROWS.find(
    (row) => row.kind === confirmAllowKind,
  );

  const applyChange = async ({
    kind,
    decision,
  }: {
    kind: ChatConsentOverridableKind;
    decision: ChatConsentDecision;
  }) => {
    setSaving(true);
    try {
      await platformApi.update(
        {
          chatConsentPolicy: consentRules.applyRule({
            settings,
            kind,
            decision,
          }),
        },
        platform.id,
      );
      await refetch();
      toast.success(t('Saved.'));
    } catch {
      toast.error(t("Couldn't save — nothing was changed."));
    } finally {
      setSaving(false);
    }
  };

  const handleDecision = ({
    kind,
    decision,
  }: {
    kind: ChatConsentOverridableKind;
    decision: ChatConsentDecision;
  }) => {
    if (decision === consentRules.ruleFor({ settings, kind })) {
      return;
    }
    if (decision === 'allow' && CONFIRM_ALLOW_KINDS.has(kind)) {
      setConfirmAllowKind(kind);
      return;
    }
    void applyChange({ kind, decision });
  };

  return (
    <div className="rounded-lg border bg-card p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
          <ListChecks className="size-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium leading-none">
            {t('Chat action rules')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t(
              'A rule per action type, for everyone in this workspace. Ask is the default; Deny blocks it outright — even after a yes in chat.',
            )}
          </p>
        </div>
      </div>
      {allowedRows.length > 0 && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-200 text-xs px-3 py-2 mt-3"
        >
          <TriangleAlert className="size-3.5 shrink-0" />
          {t('Runs without asking anyone: {rows}', {
            rows: allowedRows.map((row) => t(row.label)).join(', '),
          })}
        </div>
      )}
      <div className="mt-3 divide-y">
        {CONSENT_RULE_ROWS.map((row) => (
          <div key={row.kind} className="flex items-center gap-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm">{t(row.label)}</p>
              <p className="text-xs text-muted-foreground">{t(row.detail)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {DECISIONS.map((decision) => (
                <Toggle
                  key={decision.value}
                  size="sm"
                  variant="outline"
                  className={cn(
                    'text-xs',
                    decision.value === 'allow' && ALLOW_ON_CLASSES,
                  )}
                  pressed={
                    consentRules.ruleFor({ settings, kind: row.kind }) ===
                    decision.value
                  }
                  disabled={saving}
                  aria-label={`${t(decision.label)} — ${t(row.label)}`}
                  onPressedChange={(pressed) => {
                    if (pressed) {
                      handleDecision({
                        kind: row.kind,
                        decision: decision.value,
                      });
                    }
                  }}
                >
                  {t(decision.label)}
                </Toggle>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Dialog
        open={confirmAllowKind !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAllowKind(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-warning-700 dark:text-warning-300" />
              {t('Allow "{action}" without asking?', {
                action: confirmRow ? t(confirmRow.label) : '',
              })}
            </DialogTitle>
            <DialogDescription>
              {t(
                'The assistant will do this without asking anyone, in every conversation in this workspace — including conversations that otherwise ask first.',
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setConfirmAllowKind(null)}
            >
              {t('Keep asking')}
            </Button>
            <Button
              type="button"
              className="bg-warning-700 text-white hover:bg-warning-800 dark:bg-warning-700 dark:hover:bg-warning-600"
              onClick={() => {
                const kind = confirmAllowKind;
                setConfirmAllowKind(null);
                if (kind !== null) {
                  void applyChange({ kind, decision: 'allow' });
                }
              }}
            >
              {t('Allow without asking')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
