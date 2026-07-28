import {
  ChatConsentDecision,
  ChatConsentOverridableKind,
  ChatConsentPolicySettings,
} from '@activepieces/shared';

function ruleFor({
  settings,
  kind,
}: {
  settings: ChatConsentPolicySettings | null | undefined;
  kind: ChatConsentOverridableKind;
}): ChatConsentDecision {
  return settings?.overrides?.[kind] ?? 'ask';
}

function applyRule({
  settings,
  kind,
  decision,
}: {
  settings: ChatConsentPolicySettings | null | undefined;
  kind: ChatConsentOverridableKind;
  decision: ChatConsentDecision;
}): ChatConsentPolicySettings {
  const { [kind]: _removed, ...keptOverrides } = settings?.overrides ?? {};
  const overrides =
    decision === 'ask' ? keptOverrides : { ...keptOverrides, [kind]: decision };
  const next: ChatConsentPolicySettings = {
    ...(settings ?? {}),
    overrides,
  };
  if (Object.keys(overrides).length === 0) {
    delete next.overrides;
  }
  return next;
}

function hasAllowedRule({
  settings,
}: {
  settings: ChatConsentPolicySettings | null | undefined;
}): boolean {
  return Object.values(settings?.overrides ?? {}).some(
    (decision) => decision === 'allow',
  );
}

export const consentRules = {
  ruleFor,
  applyRule,
  hasAllowedRule,
};

export const CONSENT_RULE_ROWS: {
  kind: ChatConsentOverridableKind;
  label: string;
  detail: string;
}[] = [
  {
    kind: 'financial',
    label: 'Move money',
    detail: 'Refunds, charges, transfers, and invoices.',
  },
  {
    kind: 'destructive',
    label: 'Permanently delete data',
    detail: 'Deletions in connected apps that cannot be undone.',
  },
  {
    kind: 'internal_destructive',
    label: 'Delete workspace data',
    detail: 'Tables, records, and flows inside this workspace.',
  },
  {
    kind: 'outward_send',
    label: 'Send real messages',
    detail: 'Emails, chat messages — anything a person receives.',
  },
  {
    kind: 'external_write',
    label: 'Change connected apps',
    detail: 'Create or update data in tools like Sheets or Slack.',
  },
  {
    kind: 'input_dependent',
    label: 'Run custom code',
    detail: "We can't tell what code will do until it runs.",
  },
  {
    kind: 'unknown',
    label: 'Anything unidentified',
    detail: 'Actions the catalog cannot classify.',
  },
];
