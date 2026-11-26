import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient } from '../common/client';
import { carboneProps } from '../common/props';


export const updateTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_update_template',
  classification: 'WRITE',
  displayName: 'Update Template Metadata',
  description: 'Update the metadata of an existing Carbone template.',
  audience: 'both',
  aiMetadata: {
    description: 'Updates metadata (name, comment, category, tags, deploy/expire timestamps) on an existing Carbone template or version identified by its ID; only the fields supplied are changed, at least one field is required, and a non-empty tag list replaces the saved tags (an empty list is ignored, so tags cannot be cleared here). Use to rename, recategorize, or schedule deployment/expiry of a stored template. Idempotent: repeating the call with the same fields leaves the template in the same end state.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'templateId', label: 'Template ID' },
      {
        key: 'updated',
        label: 'Updated Fields',
        children: [
          { key: 'name', label: 'Name' },
          { key: 'comment', label: 'Comment' },
          { key: 'category', label: 'Category' },
          { key: 'tags', label: 'Tags' },
          { key: 'deployedAt', label: 'Deployed At (Unix)', format: 'number' },
          { key: 'expireAt', label: 'Expire At (Unix)', format: 'number' },
        ],
      },
    ],
  },
  props: {
    templateId: carboneProps.templateDropdown({
      displayName: 'Template ID or Version ID',
      description: 'Select a template to update.',
    }),
    name: Property.ShortText({
      displayName: 'Template Name (optional)',
      required: false,
      description:
        'New name for the template.',
    }),
    comment: Property.LongText({
      displayName: 'Comment (optional)',
      required: false,
      description:
        'New comment/description for the template.',
    }),
    category: Property.ShortText({
      displayName: 'Category (optional)',
      required: false,
      description:
        'New category for the template.',
    }),
    tags: Property.Array({
      displayName: 'Tags (optional)',
      required: false,
      description: 'A non-empty list replaces the saved tags. Leave empty to keep them.',
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          required: true,
        }),
      }
    }),
    deployedAt: Property.ShortText({
      displayName: 'Deployed At (optional)',
      required: false,
      description:
        'UTC Unix timestamp for when this version should be considered deployed. Values >= 42000000000 (year 3300) = "NOW". Used to determine active version.',
    }),
    expireAt: Property.ShortText({
      displayName: 'Expire At (optional)',
      required: false,
      description:
        'UTC Unix timestamp for when to delete the template. Values >= 42000000000 (year 3300) = "now". This effectively schedules deletion.',
    }),
  },
  async run(context) {
    const { name, comment, category, tags, deployedAt, expireAt } = context.propsValue;
    const templateId = carboneClient.readId({ value: context.propsValue.templateId, label: 'Template ID' });
    const body: Record<string, unknown> = {};
    const trimmedName = name?.trim();
    if (trimmedName) body['name'] = trimmedName;
    const trimmedComment = comment?.trim();
    if (trimmedComment) body['comment'] = trimmedComment;
    const trimmedCategory = category?.trim();
    if (trimmedCategory) body['category'] = trimmedCategory;
    const tagList = carboneProps.readTags(tags);
    if (tagList !== undefined && tagList.length > 0) body['tags'] = tagList;
    const deployed = parseTimestamp({ value: deployedAt, label: 'Deployed At' });
    if (deployed !== undefined) body['deployedAt'] = deployed;
    const expire = parseTimestamp({ value: expireAt, label: 'Expire At' });
    if (expire !== undefined) body['expireAt'] = expire;
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to update.');
    }

    await carboneClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `/template/${encodeURIComponent(templateId)}`,
      operation: 'update template',
      body,
      headers: { 'Content-Type': 'application/json' },
    });

    return {
      success: true,
      templateId,
      updated: body,
    };
  },
});

function parseTimestamp({ value, label }: { value: string | undefined; label: string }): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`${label} must be a Unix timestamp in seconds, for example 1767225600.`);
  }
  if (trimmed.replace(/^0+(?=\d)/, '').length > MAX_SECONDS_DIGITS) {
    throw new Error(`${label} looks like a timestamp in milliseconds. Use seconds, for example 1767225600.`);
  }
  return Number(trimmed);
}

const MAX_SECONDS_DIGITS = 12;
