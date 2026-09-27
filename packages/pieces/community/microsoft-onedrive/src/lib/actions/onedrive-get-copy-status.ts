import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveGetCopyStatusOutputSchema } from '../output-schemas';

export const onedriveGetCopyStatus = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_get_copy_status',
  displayName: 'Get Copy Status',
  description: 'Check the progress of a copy started with Copy File or Folder.',
  audience: 'ai',
  outputSchema: onedriveGetCopyStatusOutputSchema,
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the current status of a copy started by Copy File or Folder, once per call, from the monitor URL that action returned. Call it again later while the status is notStarted or inProgress; when it is completed, resourceId is the ID of the new copy, and when it is failed, errorMessage explains why (for example a name conflict). Only accepts monitor URLs on OneDrive and SharePoint hosts.',
    idempotent: true,
  },
  props: {
    monitorUrl: Property.ShortText({
      displayName: 'Monitor URL',
      description: 'The monitorUrl returned by Copy File or Folder.',
      required: true,
    }),
  },
  async run(context) {
    const url = validateMonitorUrl({ monitorUrl: context.propsValue.monitorUrl });
    try {
      const response = await httpClient.sendRequest<MonitorStatus>({
        method: HttpMethod.GET,
        url,
        followRedirects: false,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers?.['location'];
        const target = Array.isArray(location) ? location[0] : location;
        return {
          status: 'completed',
          percentageComplete: 100,
          resourceId: target ? extractItemId({ location: target }) : null,
          errorCode: null,
          errorMessage: null,
        };
      }
      return toStatus({ body: response.body });
    } catch (error) {
      throw new Error(oneDriveApi.describeError(error));
    }
  },
});

function validateMonitorUrl({ monitorUrl }: { monitorUrl: string }): string {
  let parsed: URL;
  try {
    parsed = new URL(monitorUrl.trim());
  } catch {
    throw new Error('Monitor URL is not a valid URL. Pass the monitorUrl returned by Copy File or Folder.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Monitor URL must use https.');
  }
  const host = parsed.hostname.toLowerCase();
  const allowed =
    ALLOWED_EXACT_HOSTS.includes(host) || ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  if (!allowed) {
    throw new Error(`Monitor URL host "${host}" is not a OneDrive or SharePoint host.`);
  }
  return parsed.toString();
}

function extractItemId({ location }: { location: string }): string | null {
  const match = /\/items\/([^/?#:]+)/.exec(location);
  return match ? decodeURIComponent(match[1]) : null;
}

function toStatus({ body }: { body: MonitorStatus | undefined }): CopyStatus {
  const status = body?.status ?? 'unknown';
  const errorCode = body?.error?.code ?? body?.errorCode ?? null;
  const rawMessage = body?.error?.message ?? null;
  return {
    status,
    percentageComplete: body?.percentageComplete ?? null,
    resourceId: body?.resourceId ?? null,
    errorCode,
    errorMessage: describeFailure({ status, errorCode, rawMessage }),
  };
}

function describeFailure({
  status,
  errorCode,
  rawMessage,
}: {
  status: string;
  errorCode: string | null;
  rawMessage: string | null;
}): string | null {
  if (errorCode === 'nameAlreadyExists') {
    return 'The destination already has an item with this name. Start the copy again with a different New Name.';
  }
  if (rawMessage) {
    return rawMessage;
  }
  if (status === 'failed') {
    return errorCode ? `The copy failed (${errorCode}).` : 'The copy failed.';
  }
  return null;
}

const ALLOWED_EXACT_HOSTS = ['api.onedrive.com'];
const ALLOWED_HOST_SUFFIXES = [
  '.svc.ms',
  '.microsoftpersonalcontent.com',
  '.sharepoint.com',
  '.sharepoint.us',
  '.sharepoint-df.com',
];

type MonitorStatus = {
  status?: string;
  percentageComplete?: number;
  resourceId?: string;
  errorCode?: string;
  error?: { code?: string; message?: string };
};

type CopyStatus = {
  status: string;
  percentageComplete: number | null;
  resourceId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
};
