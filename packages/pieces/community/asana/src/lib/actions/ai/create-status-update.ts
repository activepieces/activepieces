import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaStatusUpdateOutputSchema } from '../../output-schemas';

const STATUS_TYPE_OPTIONS = [
  { label: 'On track', value: 'on_track' },
  { label: 'At risk', value: 'at_risk' },
  { label: 'Off track', value: 'off_track' },
  { label: 'On hold (projects and portfolios)', value: 'on_hold' },
  { label: 'Complete (projects and portfolios)', value: 'complete' },
  { label: 'Achieved (goals)', value: 'achieved' },
  { label: 'Partial (goals)', value: 'partial' },
  { label: 'Missed (goals)', value: 'missed' },
  { label: 'Dropped', value: 'dropped' },
];

export const asanaCreateStatusUpdateAction = createAction({
  auth: asanaAuth,
  name: 'create_status_update',
  classification: 'WRITE',
  displayName: 'Create Status Update',
  description: 'Post a status update on an Asana project, portfolio or goal.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a status update (status type, title, text) on a project, and on paid plans a portfolio or goal; it becomes the current status and notifies followers. Projects accept on_track, at_risk, off_track, on_hold, complete or dropped; goals on_track, at_risk, off_track, achieved, partial, missed or dropped. Each call posts a new update, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaStatusUpdateOutputSchema,
  props: {
    parent: Property.ShortText({
      displayName: 'Parent GID',
      description: 'Gid of the project (or portfolio or goal) to post on. Obtain a project gid from List Projects.',
      required: true,
    }),
    status_type: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Overall status; valid values depend on the parent type.',
      required: true,
      options: { disabled: false, options: STATUS_TYPE_OPTIONS },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Headline of the update, for example "Week 40: on track for launch".',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'Plain-text body of the update. Required by Asana even when HTML Text is also set.',
      required: true,
    }),
    html_text: Property.LongText({
      displayName: 'HTML Text',
      description: 'Optional rich-text body in Asana rich text, wrapped in <body>...</body>.',
      required: false,
    }),
  },
  async run(context) {
    const { parent, status_type, title, text, html_text } = context.propsValue;
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/status_updates',
      operation: 'Create Status Update',
      query: { opt_fields: ASANA_FIELDS.statusUpdate },
      data: {
        parent: parent.trim(),
        status_type,
        text,
        ...(asanaUtils.hasValue(title) ? { title } : {}),
        ...(asanaUtils.hasValue(html_text) ? { html_text } : {}),
      },
    });
  },
});
