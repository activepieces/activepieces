import { createAction, Property } from '@activepieces/pieces-framework';
import type { ContentType } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointCreateContentTypeOutputSchema } from '../../../output-schemas';

export const updateContentTypeAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_content_type',
  outputSchema: microsoftSharepointCreateContentTypeOutputSchema,
  displayName: 'Update Content Type',
  description: 'Updates the properties of a SharePoint site content type.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the name, description, group or flags of one site content type; only the properties set are sent. List Content Types returns the content type IDs; use Update List Content Type for a content type attached to a list.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    contentTypeId: Property.ShortText({
      displayName: 'Content Type ID',
      description: 'ID of the site content type, like "0x0101...". Use List Content Types to find it.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name of the content type.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description of the content type.',
      required: false,
    }),
    group: Property.ShortText({
      displayName: 'Group',
      description: 'Group to list the content type under.',
      required: false,
    }),
    hidden: microsoftSharePointAiProps.booleanProp({
      displayName: 'Hidden',
      description: 'Whether the content type is hidden from the New menu of lists. Leave empty to keep it unchanged.',
    }),
    readOnly: microsoftSharePointAiProps.booleanProp({
      displayName: 'Read Only',
      description: 'Whether the content type can no longer be changed until this is set back to false. Leave empty to keep it unchanged.',
    }),
    sealed: microsoftSharePointAiProps.booleanProp({
      displayName: 'Sealed',
      description: 'Whether the content type can no longer be changed by users or through push-down. Leave empty to keep it unchanged.',
    }),
    propagateChanges: microsoftSharePointAiProps.booleanProp({
      displayName: 'Propagate Changes',
      description:
        'Whether this change is pushed down to content types and lists that inherit from this content type. Leave empty to keep it unchanged.',
    }),
  },
  async run({ auth, propsValue }) {
    const body: ContentType = Object.fromEntries(
      Object.entries({
        name: propsValue.name,
        description: propsValue.description,
        group: propsValue.group,
        hidden: microsoftSharePointUtils.booleanChoice({ value: propsValue.hidden, propName: 'Hidden' }),
        readOnly: microsoftSharePointUtils.booleanChoice({ value: propsValue.readOnly, propName: 'Read Only' }),
        sealed: microsoftSharePointUtils.booleanChoice({ value: propsValue.sealed, propName: 'Sealed' }),
        propagateChanges: microsoftSharePointUtils.booleanChoice({
          value: propsValue.propagateChanges,
          propName: 'Propagate Changes',
        }),
      }).filter(([, value]) => value !== undefined)
    );
    if (Object.keys(body).length === 0) {
      throw new Error(
        'Set at least one of Name, Description, Group, Hidden, Read Only, Sealed or Propagate Changes.'
      );
    }
    const contentType: ContentType = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes/${encodeURIComponent(propsValue.contentTypeId)}`
      )
      .patch(body);
    return contentType;
  },
});
