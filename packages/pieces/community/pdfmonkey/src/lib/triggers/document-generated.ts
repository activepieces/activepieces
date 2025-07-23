import { createTrigger, Property, PiecePropValueSchema, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { pdfmonkeyAuth } from '../auth';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<PiecePropValueSchema<typeof pdfmonkeyAuth>, { workspaceId?: string, status?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { workspaceId, status } = propsValue;

    if(!lastFetchEpochMS) lastFetchEpochMS = 0;

    // https://docs.pdfmonkey.io/references/api/documents#query-parameters
    let query: { [key: string]: any } = {
      'q[updated_since]': Math.ceil(lastFetchEpochMS / 1000)
    };

    if(workspaceId) query['q[workspace_id]'] = workspaceId;
    if(status) query['q[status]'] = status;

    // https://docs.pdfmonkey.io/references/api/documents#listing-documents
    const response = await makeRequest({
      auth,
      path: '/document_cards',
      method: HttpMethod.GET,
      queryParams: query,
    });

    const document_cards = response.body.document_cards || [];
    return document_cards.map((resource: any) => ({
      epochMilliSeconds: new Date(resource.created_at).getTime(),
      data: resource,
    }));
  },
};

export const documentGenerated = createTrigger({
  name: 'document_generated',
  displayName: 'Document Generated',
  description: 'Fires when a new document is generated.',
  auth: pdfmonkeyAuth,
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'ID of the workspace (optional)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Status of the document',
      required: true,
      defaultValue: 'success',
      options: {
        disabled: false,
        options: [
          { label: 'Success', value: 'success' },
          { label: 'Draft', value: 'draft' },
          { label: 'Failure', value: 'failure' },
        ],
      }
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    // https://docs.pdfmonkey.io/references/api/documents#tab-id-200-ok-listing-documentcards
    "id": "11475e57-0334-4ad5-8896-9462a2243957",
    "app_id": "c2b67b84-4aac-49ea-bed8-69a15d7a65d3",
    "created_at": "2022-04-07T11:01:38.201+02:00",
    "document_template_id": "96611e9e-ab03-4ac3-8551-1b485210c892",
    "document_template_identifier": "My Awesome Template",
    "download_url": "https://pdfmonkey.s3.eu-west-1.amazonaws.com/production/backend/document/11475e57-0334-4ad5-8896-9462a2243957/my-test-document.pdf?response-content-disposition=attachment&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJ2ZTKW4HMOLK63IQ%2F20220406%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20220407T204150Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&X-Amz-Signature=24e3a8c0801ad8d1efd6aaa22d946ee70f5c8d5b55c586f346a094afa5046c77",
    "failure_cause": null,
    "filename": "my-test-document.pdf",
    "meta": "{ \"_filename\":\"my-test-document.pdf\" }",
    "public_share_link": "https://files.pdfmonkey.io/share/5CEA8C37-D130-4C19-9E11-72BE2293C82B/my-test-document.pdf",
    "status": "success",
    "updated_at": "2022-04-03T11:12:56.023+02:00"
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
