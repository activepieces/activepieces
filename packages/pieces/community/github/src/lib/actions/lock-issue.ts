import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubLockIssueAction = createAction({
  auth: githubAuth,
  name: 'lockIssue',
  classification: 'WRITE',
  displayName: 'Lock Issue',
  description: 'Locks an issue so only collaborators can comment.',
  audience: 'human',
  aiMetadata: {
    description:
      'Locks an issue (by number) so only collaborators can comment, optionally recording a lock reason (off-topic, too heated, resolved, or spam). Use to freeze discussion on an issue or pull request. Idempotent: re-locking an already-locked issue leaves it locked.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'issue',
      display: 'section',
      label: 'Issue',
      icon: 'inbox',
      props: ['repository', 'issue_number'],
    },
    {
      key: 'lock',
      display: 'section',
      label: 'Lock',
      icon: 'sliders',
      props: ['lock_reason'],
    },
  ],
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number shown after # on GitHub.',
      required: true,
    }),
    lock_reason: Property.Dropdown<
      'off-topic' | 'too heated' | 'resolved' | 'spam' | undefined,
      false,
      typeof githubAuth
    >({
      auth: githubAuth,
      displayName: 'Lock Reason',
      description: "Shown on the issue's timeline.",
      required: false,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { value: 'off-topic', label: 'Off-topic' },
            { value: 'too heated', label: 'Too heated' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'spam', label: 'Spam' },
          ],
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { issue_number, lock_reason } = propsValue;
    const { owner, repo } = propsValue.repository!;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.PUT,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/lock`,
      body: {
        lock_reason,
      },
    });
    return response;
  },
});
