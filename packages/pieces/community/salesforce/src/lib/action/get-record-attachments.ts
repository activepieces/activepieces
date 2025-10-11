import { Property, createAction } from '@activepieces/pieces-framework';
import { querySalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const getRecordAttachments = createAction({
  auth: salesforceAuth,
  name: 'get_record_attachments',
  displayName: 'Get Record Attachments',
  description: 'Retrieves all attachments for a given record in Salesforce',
  props: {
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'ID of the parent record',
      required: true,
    }),
  },
  async run(context) {
    const { recordId } = context.propsValue;

    const query = `
      SELECT
        Id, Name, ContentType, BodyLength, CreatedDate, CreatedById, LastModifiedDate
      FROM
        Attachment
      WHERE ParentId = '${recordId}'
      ORDER BY CreatedDate DESC
    `;

    const response = await querySalesforceApi(
      HttpMethod.GET,
      context.auth,
      query
    );

    return response.body;
  },
});

