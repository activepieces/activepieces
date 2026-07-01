import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { loopquestAuth, baseUrl, authHeaders, LoopQuestAuth } from '../auth';
import { buildTaskBody } from '../common/build-task-body';

export const createReviewTask = createAction({
  auth: loopquestAuth,
  name: 'create_review_task',
  displayName: 'Create Review Task',
  description:
    "Send AI/automation output to a human. Gate a downstream step until it's approved, or monitor quality in the background.",
  props: {
    content: Property.LongText({
      displayName: 'Content',
      required: true,
      description: 'The output a human should review.',
    }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    module: Property.StaticDropdown({
      displayName: 'Game',
      required: false,
      defaultValue: 'swiper',
      description: 'How the reviewer sees the item.',
      options: {
        options: [
          { label: 'Swiper — approve or reject', value: 'swiper' },
          { label: 'Versus — pick the better of two', value: 'versus' },
          { label: 'Sorter — bucket into categories', value: 'sorter' },
          { label: 'Detective — spot the problem', value: 'detective' },
          { label: 'Fixer — correct the output', value: 'fixer' },
          { label: 'Redact — mask sensitive text', value: 'redact' },
          { label: 'Grounding — verify a claim against a source', value: 'grounding' },
        ],
      },
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      required: false,
      defaultValue: 'monitor',
      description:
        'Gate blocks a downstream step until a human approves (pair with the New Verdict trigger). Monitor reviews in the background.',
      options: {
        options: [
          { label: 'Monitor — review in the background', value: 'monitor' },
          { label: 'Gate — block until a human approves', value: 'gate' },
        ],
      },
    }),
    claim: Property.LongText({
      displayName: 'Claim',
      required: false,
      description: 'Grounding only: the statement to verify.',
    }),
    sourceText: Property.LongText({
      displayName: 'Source text',
      required: false,
      description: 'Grounding only: the reference the claim is checked against.',
    }),
    timeoutSeconds: Property.Number({
      displayName: 'Timeout (seconds)',
      required: false,
      description:
        'Gate only: apply the fallback if no one reviews in time (30–2592000).',
    }),
    onTimeout: Property.StaticDropdown({
      displayName: 'On timeout',
      required: false,
      description:
        'Gate only: what to do if the timeout is hit. Defaults to escalate (fail-closed).',
      options: {
        options: [
          { label: 'Escalate — flag for a human', value: 'escalate' },
          { label: 'Reject — treat as a flag', value: 'reject' },
          { label: 'Approve — treat as approved', value: 'approve' },
        ],
      },
    }),
    source: Property.ShortText({
      displayName: 'Source',
      required: false,
      defaultValue: 'activepieces',
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      required: false,
      description: 'Your own id — echoed back in the verdict for correlation.',
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      required: false,
      description:
        "Optional single webhook for this task's verdict. Leave blank if you use the New Verdict trigger.",
    }),
    reviewsRequired: Property.Number({
      displayName: 'Reviewers required',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as LoopQuestAuth;
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl(auth)}/api/v1/tasks`,
      headers: authHeaders(auth),
      body: buildTaskBody(context.propsValue as Record<string, unknown>),
    });
    return res.body;
  },
});
