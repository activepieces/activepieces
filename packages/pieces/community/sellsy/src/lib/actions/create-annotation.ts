import { createAction, Property } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { commentIdDropdown } from '../common/props';

export const createAnnotation = createAction({
  auth: sellsyAuth,
  name: 'createAnnotation',
  displayName: 'Create Annotation',
  description:
    'Create a comment/annotation on a Sellsy object (opportunity, company, contact, etc.)',
  props: {
    description: Property.LongText({
      displayName: 'Comment Content',
      description: 'The content of the comment/annotation',
      required: true,
    }),
    relatedObjectType: Property.StaticDropdown({
      displayName: 'Related Object Type',
      description: 'Type of object this comment relates to',
      required: true,
      options: {
        options: [
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Company', value: 'company' },
          { label: 'Individual', value: 'individual' },
          { label: 'Contact', value: 'contact' },
          { label: 'Item', value: 'item' },
          { label: 'Estimate', value: 'estimate' },
          { label: 'Credit Note', value: 'creditnote' },
          { label: 'Order', value: 'order' },
          { label: 'Delivery', value: 'delivery' },
          { label: 'Proforma', value: 'proforma' },
          { label: 'Invoice', value: 'invoice' },
          { label: 'Model', value: 'model' },
          { label: 'Purchase Order', value: 'purchase-order' },
          { label: 'Purchase Delivery', value: 'purchase-delivery' },
          { label: 'Purchase Invoice', value: 'purchase-invoice' },
          { label: 'Purchase Credit Note', value: 'purchase-creditnote' },
          { label: 'Redactor Template', value: 'redactor-template' },
          { label: 'Redactor Document', value: 'redactor-document' },
          { label: 'Campaign', value: 'campaign' },
        ],
      },
    }),
    relatedObjectId: Property.Number({
      displayName: 'Related Object ID',
      description: 'ID of the object this comment relates to',
      required: true,
    }),
    parentId: commentIdDropdown,
    mentionedStaffIds: Property.Array({
      displayName: 'Mentioned Staff IDs',
      description: 'IDs of staff members mentioned in the comment',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const requestBody: any = {
      description: propsValue.description,
      related: [
        {
          id: propsValue.relatedObjectId,
          type: propsValue.relatedObjectType,
        },
      ],
    };

    // Add optional fields if provided
    if (propsValue.parentId) {
      requestBody.parent_id = propsValue.parentId;
    }

    if (
      propsValue.mentionedStaffIds &&
      Array.isArray(propsValue.mentionedStaffIds) &&
      propsValue.mentionedStaffIds.length > 0
    ) {
      requestBody.mentioned_staff_ids = propsValue.mentionedStaffIds;
    }

    try {
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.POST,
        '/comments',
        requestBody
      );

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to create annotation: ${error.message}`);
    }
  },
});
