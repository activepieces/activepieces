import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';

function mailboxId<R extends boolean>({
  required,
  displayName = 'Mailbox ID',
  description = 'Numeric ID of the Parseur mailbox (parser), e.g. "123456". Use List Mailboxes to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function targetMailboxId<R extends boolean>({
  required,
  displayName = 'Target Mailbox ID',
  description = 'Numeric ID of the mailbox to copy into. Use List Mailboxes to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function documentId<R extends boolean>({
  required,
  displayName = 'Document ID',
  description = 'ID of the document: the numeric "id" from List Documents, or the DocumentID the upload actions return.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function templateId<R extends boolean>({
  required,
  displayName = 'Template ID',
  description = 'Numeric ID of the template. Use List Templates to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function page<R extends boolean>({
  required,
  displayName = 'Page',
  description = 'Page number to return, starting at 1. Defaults to 1. The response\'s "total" is the number of pages.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function limit<R extends boolean>({
  required,
  displayName = 'Limit',
  description = 'Items per page (1-100). Defaults to 25.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function search<R extends boolean>({
  required,
  displayName = 'Search',
  description = 'Case-insensitive partial match on the name.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function aiEngine<R extends boolean>({
  required,
  displayName = 'AI Engine',
  description = 'Parsing engine. DISABLED uses templates only; GCP_AI_2, GCP_AI_3_TXT and GCP_AI_4 are AI engines (Get Option Values lists them with labels).',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: AI_ENGINES.map((value) => ({ label: value, value })),
    },
  });
}

function aiInstructions<R extends boolean>({
  required,
  displayName = 'AI Instructions',
  description = 'General instructions the AI engine follows for every document in this mailbox.',
}: PropParams<R>) {
  return Property.LongText({ displayName, description, required });
}

function emailPrefix<R extends boolean>({
  required,
  displayName = 'Email Prefix',
  description = 'Part before "@in.parseur.com" in the mailbox\'s email address. Must be unique across Parseur.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function mailboxFields<R extends boolean>({
  required,
  displayName = 'Fields',
  description = 'The mailbox\'s fields to extract, as a JSON array of objects: {"name": "InvoiceNumber", "format": "ONELINE", "query": "The invoice number"}. format is one of TEXT, ONELINE, DATE, TIME, DATETIME, NUMBER, NAME, ADDRESS, TABLE, LINK. To keep an existing field, include it with its "id" from Get Mailbox.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function additionalFields<R extends boolean>({
  required,
  displayName = 'Additional Settings',
  description = 'Other mailbox settings as a JSON object, using Parseur\'s field names, e.g. {"retention_policy": 30, "process_attachments": true}. The dedicated inputs override the same keys here.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function customDownloadId<R extends boolean>({
  required,
  displayName = 'Custom Download ID',
  description = 'Numeric ID of the custom download. Use List Custom Downloads to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function customDownloadType<R extends boolean>({
  required,
  displayName = 'Type',
  description = 'PARSER exports the mailbox\'s fields, one row per document; PARSER_FIELD exports one table field, one row per table row (needs Table Field ID).',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: [
        { label: 'PARSER', value: 'PARSER' },
        { label: 'PARSER_FIELD', value: 'PARSER_FIELD' },
      ],
    },
  });
}

function tableFieldId<R extends boolean>({
  required,
  displayName = 'Table Field ID',
  description = 'ID of the table field to export, from the mailbox\'s parser_object_set in Get Mailbox. Only for Type PARSER_FIELD.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function downloadItems<R extends boolean>({
  required,
  displayName = 'Columns',
  description = 'Field names to include as columns, in order, e.g. ["InvoiceNumber", "Total"]. Get Mailbox Schema lists them.',
}: PropParams<R>) {
  return Property.Array({ displayName, description, required });
}

export const parseurAiProps = {
  mailboxId,
  targetMailboxId,
  documentId,
  templateId,
  page,
  limit,
  search,
  aiEngine,
  aiInstructions,
  emailPrefix,
  mailboxFields,
  additionalFields,
  customDownloadId,
  customDownloadType,
  tableFieldId,
  downloadItems,
};

const AI_ENGINES = ['DISABLED', 'GCP_AI_2', 'GCP_AI_3_TXT', 'GCP_AI_4'];

