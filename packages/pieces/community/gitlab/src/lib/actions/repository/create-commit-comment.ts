import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { encodeSegment, gitlabRequest, projectPath } from '../../common/client';
import {
  gitlabProps,
  optionalPositiveInt,
  optionalText,
  requireText,
} from '../../common/props';
import { commitCommentOutputSchema } from '../../output-schemas';

export const createCommitCommentAction = createAction({
  auth: gitlabAuth,
  name: 'create_commit_comment',
  displayName: 'Add Commit Comment',
  description: 'Adds a comment to a commit, optionally on a line of a file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Posts a comment on a GitLab commit, either on the whole commit or on one line of a changed file (set File Path, Line and Line Type together; the line must be part of that commit's diff, otherwise GitLab posts it as a general comment and lineAnchored is false). Not idempotent: each call posts a new comment.",
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    sha: gitlabProps.sha(),
    note: Property.LongText({ displayName: 'Comment', required: true }),
    path: Property.ShortText({ displayName: 'File Path', required: false }),
    line: Property.Number({ displayName: 'Line', required: false }),
    lineType: Property.StaticDropdown({
      displayName: 'Line Type',
      required: false,
      options: {
        options: [
          { label: 'New (added or unchanged line)', value: 'new' },
          { label: 'Old (removed line)', value: 'old' },
        ],
      },
    }),
  },
  outputSchema: commitCommentOutputSchema,
  async run({ auth, propsValue }) {
    const path = optionalText(propsValue.path);
    const line = optionalPositiveInt({ value: propsValue.line, label: 'Line' });
    const lineType = propsValue.lineType;
    const anchored = [path, line, lineType].filter(
      (value) => value !== undefined && value !== null && value !== ''
    ).length;
    if (anchored !== 0 && anchored !== 3) {
      throw new Error(
        'Set File Path, Line and Line Type together, or none of them.'
      );
    }
    const comment = await gitlabRequest<Record<string, unknown>>({
      auth,
      method: 'POST',
      path: `${projectPath(
        propsValue.projectId
      )}/repository/commits/${encodeSegment({
        value: propsValue.sha,
        label: 'Commit SHA',
      })}/comments`,
      body: {
        note: requireText({ value: propsValue.note, label: 'Comment' }),
        path,
        line,
        line_type: lineType || undefined,
      },
    });
    return {
      ...comment,
      lineAnchored:
        anchored === 3 &&
        comment?.['path'] !== null &&
        comment?.['path'] !== undefined,
    };
  },
});
