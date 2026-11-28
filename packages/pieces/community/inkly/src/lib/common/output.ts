import { InklyDocument, InklyRecipient } from './client';

function recipient(item: InklyRecipient): RecipientOutput {
  return {
    id: item.id,
    role: item.role,
    name: item.name,
    email: item.email,
    status: item.status,
    viewed_at: item.viewed_at ?? null,
    signed_at: item.signed_at ?? null,
    declined_at: item.declined_at ?? null,
    decline_reason: item.decline_reason ?? null,
  };
}

function fieldValues(fields: InklyDocument['fields']): Record<string, string | boolean> {
  return (fields ?? []).reduce<Record<string, string | boolean>>((values, field) => {
    if (field.value === null || field.value === undefined) {
      return values;
    }
    return { ...values, [availableLabel({ values, label: field.label })]: field.value };
  }, {});
}

function availableLabel({ values, label }: { values: Record<string, unknown>; label: string }): string {
  if (!Object.prototype.hasOwnProperty.call(values, label)) {
    return label;
  }
  let copy = 2;
  while (Object.prototype.hasOwnProperty.call(values, `${label} (${copy})`)) {
    copy += 1;
  }
  return `${label} (${copy})`;
}

function document({ item, withFieldValues }: { item: InklyDocument; withFieldValues: boolean }): DocumentOutput {
  return {
    document_id: item.id,
    title: item.title,
    status: item.status,
    external_id: item.external_id ?? null,
    template_id: item.template_id ?? null,
    source: item.source ?? null,
    created_at: item.created_at ?? null,
    sent_at: item.sent_at ?? null,
    completed_at: item.completed_at ?? null,
    voided_at: item.voided_at ?? null,
    recipients: item.recipients.map(recipient),
    ...(withFieldValues ? { field_values: fieldValues(item.fields) } : {}),
  };
}

function event({
  eventId,
  eventType,
  item,
  signer,
  withFieldValues,
}: {
  eventId: string;
  eventType: string;
  item: InklyDocument;
  signer?: InklyRecipient;
  withFieldValues: boolean;
}): Record<string, unknown> {
  return {
    event_id: eventId,
    event_type: eventType,
    ...document({ item, withFieldValues }),
    ...(signer
      ? {
          signer_id: signer.id,
          signer_name: signer.name,
          signer_email: signer.email,
          signer_signed_at: signer.signed_at,
        }
      : {}),
  };
}

export const inklyOutput = {
  document,
  event,
};

type RecipientOutput = {
  id: string;
  role: string;
  name: string | null;
  email: string | null;
  status: string;
  viewed_at: string | null;
  signed_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
};

export type DocumentOutput = {
  document_id: string;
  title: string;
  status: string;
  external_id: string | null;
  template_id: string | null;
  source: string | null;
  created_at: string | null;
  sent_at: string | null;
  completed_at: string | null;
  voided_at: string | null;
  recipients: RecipientOutput[];
  field_values?: Record<string, string | boolean>;
};
