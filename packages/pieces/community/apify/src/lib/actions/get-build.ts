import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient } from '../common';
import { getBuildActionOutputSchema } from '../output-schemas';

export const apifyGetBuild = createAction({
  name: 'apify_get_build',
  auth: apifyAuth,
  displayName: 'Get Build',
  description: 'Retrieves the status and metadata of an Actor build by build ID.',
  audience: 'ai',
  outputSchema: getBuildActionOutputSchema,
  aiMetadata: {
    description:
      'Read the status and metadata of one Actor build by its build ID. Use this to poll a build (e.g. one triggered elsewhere) until it reaches a terminal state. Optionally set waitForFinish (seconds, max 60) to block server-side. Read the build\'s log with Get Run Log. Read-only and idempotent; this performs a single status read, not an unbounded wait.',
    idempotent: true,
  },
  props: {
    buildId: Property.ShortText({
      displayName: 'Build ID',
      description:
        'The ID of the build to read. Obtain it from an actor\'s build list or a run\'s buildId.',
      required: true,
    }),
    waitForFinish: Property.Number({
      displayName: 'Wait For Finish (seconds)',
      description:
        'Optional. Block server-side up to this many seconds (max 60) waiting for the build to finish before returning. Leave empty for an immediate status read.',
      required: false,
    }),
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { buildId, waitForFinish } = context.propsValue;

    const client = createApifyClient(apifyToken);

    try {
      const options =
        waitForFinish != null
          ? { waitForFinish: Math.min(Math.max(waitForFinish, 0), 60) }
          : undefined;
      const build = await client.build(buildId).get(options);

      if (!build) {
        throw new Error(`Build "${buildId}" not found.`);
      }
      return build;
    } catch (error: any) {
      if (error.statusCode === 403) {
        throw new Error(`Permission denied reading build "${buildId}".`);
      }
      if (error.statusCode === 404) {
        throw new Error(`Build "${buildId}" not found.`);
      }
      if (error.statusCode === 429) {
        throw new Error('Apify rate limit exceeded. Retry after a short delay.');
      }
      throw new Error(`Failed to get build: ${error.message || error}`);
    }
  },
});
