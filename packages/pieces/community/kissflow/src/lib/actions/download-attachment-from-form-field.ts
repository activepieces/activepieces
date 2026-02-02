import {
  HttpMethod,
  httpClient,
  HttpHeaders,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import contentDisposition from 'content-disposition';

import { kissflowAuth } from '../../auth';

function extractAttachmentNameFromHeaders(
  headers?: HttpHeaders
): string | null {
  let fileName = null;

  const headerValue = headers?.['content-disposition'] as string;
  if (headerValue) {
    const parsedValue = contentDisposition.parse(headerValue);
    if (parsedValue.type === 'attachment') {
      const parsedFilename = parsedValue.parameters['filename'];
      if (parsedFilename) {
        fileName = parsedFilename;
      }
    }
  }

  return fileName;
}

export const downloadAttachmentFromFormField = createAction({
  name: 'downloadAttachmentFromFormField',
  displayName: 'Download Attachment from Form Field',
  description:
    'Downloads a specific attachment from a form field of your process.',
  auth: kissflowAuth,
  props: {
    processId: Property.ShortText({
      displayName: 'Process ID',
      required: true,
    }),
    instanceId: Property.ShortText({
      displayName: 'Instance ID',
      required: true,
    }),
    activityInstanceId: Property.ShortText({
      displayName: 'Activity Instance ID',
      required: true,
    }),
    fieldId: Property.ShortText({
      displayName: 'Field ID',
      required: true,
    }),
    attachmentId: Property.ShortText({
      displayName: 'Attachment ID',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const { processId, instanceId, activityInstanceId, fieldId, attachmentId } =
      context.propsValue;

    const requestUrl = `https://${auth.props.accountName}.${auth.props.domainName}/process/2/${auth.props.accountId}/${processId}/${instanceId}/${activityInstanceId}/${fieldId}/attachment/${attachmentId}`;
    const resp = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: requestUrl,
      headers: {
        Accept: 'application/octet-stream',
        'X-Access-Key-Id': auth.props.accessKeyId,
        'X-Access-Key-Secret': auth.props.accessKeySecret,
      },
      responseType: 'arraybuffer',
    });

    const fileName =
      extractAttachmentNameFromHeaders(resp.headers) || 'attachment';

    return await context.files.write({
      fileName: fileName,
      data: Buffer.from(resp.body),
    });
  },
});
