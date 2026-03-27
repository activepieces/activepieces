import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { CARBONE_API_URL, CARBONE_VERSION } from '../common/constants';
import { carboneProps } from '../common/props';


export const updateTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_update_template',
  displayName: 'Update Template Metadata',
  description: 'Update the metadata of an existing Carbone template.',
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
      description: 'Replace tags with a new list.',
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
    const { templateId, name, comment, category, tags, deployedAt, expireAt } =
      context.propsValue;

    const body: Record<string, unknown> = {};

    if (name !== undefined) body['name'] = name;
    if (comment !== undefined) body['comment'] = comment;
    if (category !== undefined) body['category'] = category;
    if (tags !== undefined) body['tags'] = tags.map((t) => (t as { tag: string }).tag);
    if (deployedAt !== undefined) body['deployedAt'] = Number(deployedAt);
    if (expireAt !== undefined) body['expireAt'] = Number(expireAt);

    const request: HttpRequest = {
      method: HttpMethod.PATCH,
      url: `${CARBONE_API_URL}/template/${templateId}`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'carbone-version': CARBONE_VERSION,
        'Content-Type': 'application/json',
      },
      body,
    };

    const response = await httpClient.sendRequest<{
      success: boolean;
      error?: string;
    }>(request);

    if (!response.body.success) {
      throw new Error(
        `Failed to update template: ${response.body.error ?? 'Unknown error'}`
      );
    }

    return {
      success: true,
      templateId,
      updated: body,
    };
  },
});
