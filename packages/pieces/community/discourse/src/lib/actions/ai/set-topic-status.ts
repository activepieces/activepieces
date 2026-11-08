import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseSchemas } from '../../common/schemas';

export const setTopicStatusAction = createAction({
  auth: discourseAuth,
  name: 'set_topic_status',
  classification: 'WRITE',
  displayName: 'Set Topic Status',
  description: 'Closes, archives, pins or unlists a Discourse topic, or reverses it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Turn one status flag of a Discourse topic on or off by numeric topic ID: closed (no new replies), archived (read-only), pinned (top of category, optional until date), pinned_globally, or visible (listed). Needs moderator rights. Reversible by calling again with Enabled flipped; safe to retry.',
    idempotent: true,
  },
  props: {
    topic_id: Property.ShortText({ displayName: 'Topic ID', description: 'Numeric topic ID.', required: true }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Closed', value: 'closed' },
          { label: 'Archived', value: 'archived' },
          { label: 'Pinned', value: 'pinned' },
          { label: 'Pinned Globally', value: 'pinned_globally' },
          { label: 'Visible (Listed)', value: 'visible' },
        ],
      },
    }),
    enabled: Property.Checkbox({ displayName: 'Enabled', description: 'On to set the status, off to remove it.', required: true, defaultValue: true }),
    until: Property.DateTime({ displayName: 'Until', description: 'Optional end date, used for pins.', required: false }),
  },
  outputSchema: discourseSchemas.topicStatus,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.topic_id, label: 'Topic ID' });
    const status = discourseInput.text({ value: propsValue.status, label: 'Status' });
    if (!STATUSES.includes(status)) {
      throw new Error(`Status must be one of ${STATUSES.join(', ')}.`);
    }
    const enabled = discourseInput.optionalBoolean(propsValue.enabled) ?? true;
    const until = discourseInput.isoDate({ value: propsValue.until, label: 'Until' });
    await discourseRequest({
      auth: auth.props,
      method: HttpMethod.PUT,
      path: `/t/${id}/status.json`,
      body: { status, enabled: enabled ? 'true' : 'false', ...(until === undefined ? {} : { until }) },
    });
    return { topic_id: Number(id), status, enabled, until: until ?? null };
  },
});

const STATUSES = ['closed', 'archived', 'pinned', 'pinned_globally', 'visible'];
