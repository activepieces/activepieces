import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getPowerBiBaseUrl, getMicrosoftCloudFromAuth } from '../common/microsoft-cloud';
import { powerBiProps } from '../common/props';
import { microsoftPowerBiAuth } from '../auth';

export const refreshDatasetAction = createAction({
  auth: microsoftPowerBiAuth,
  name: 'refresh_dataset',
  displayName: 'Refresh Dataset',
  description: 'Triggers a refresh of a Power BI dataset so its data reflects the latest changes from the underlying source.',
  audience: 'both',
  aiMetadata: {
    description: 'Starts an asynchronous refresh of a Power BI dataset in a workspace. Use this after loading new data into the dataset\'s source, or on a schedule, to update the dataset without waiting inside the flow (the refresh continues in the background). Not idempotent: each call queues another refresh, and Shared-capacity workspaces are limited to 8 refreshes per day.',
    idempotent: false,
  },
  props: {
    workspace_id: powerBiProps.workspaceIdDropdown,
    dataset_id: powerBiProps.buildDatasetIdDropdown({ workspacePropName: 'workspace_id' }),
    notify_option: Property.StaticDropdown<NotifyOption>({
      displayName: 'Notification Option',
      description: 'When to send a mail notification about the refresh outcome.',
      required: false,
      defaultValue: 'NoNotification',
      options: {
        options: [
          { label: 'No Notification', value: 'NoNotification' },
          { label: 'Mail on Failure', value: 'MailOnFailure' },
          { label: 'Mail on Completion', value: 'MailOnCompletion' },
        ],
      },
    }),
  },
  async run(context) {
    const auth = context.auth;
    const workspaceId = context.propsValue.workspace_id;
    const datasetId = context.propsValue.dataset_id;
    const notifyOption = context.propsValue.notify_option;

    const cloud = getMicrosoftCloudFromAuth(auth);
    const scopedUrl = powerBiProps.getWorkspaceScopedUrl({ baseUrl: getPowerBiBaseUrl(cloud), workspaceId });

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${scopedUrl}/datasets/${datasetId}/refreshes`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      body: { notifyOption: notifyOption ?? 'NoNotification' },
    });

    const refreshHistory = await httpClient.sendRequest<{ value: { requestId: string }[] }>({
      method: HttpMethod.GET,
      url: `${scopedUrl}/datasets/${datasetId}/refreshes?$top=1`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
    });

    return {
      success: true,
      refreshId: refreshHistory.body.value[0]?.requestId,
      workspaceId,
      datasetId,
    };
  },
});

type NotifyOption = 'NoNotification' | 'MailOnFailure' | 'MailOnCompletion';
