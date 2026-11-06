import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { listShow } from '../../common/operations';
import { listStageFilesOutputSchema } from '../../common/output-schemas';
import { stageReference } from '../../common/stage';
import { boundedInteger, sqlString } from '../../common/sql';

export const listStageFilesAction = createAction({
  name: 'list_stage_files',
  classification: 'SEARCH',
  displayName: 'List Stage Files',
  description: 'List the files in a named stage.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists files in a named stage (LIST @stage) with size, MD5 and last-modified time, optionally under a path and matching a regular expression. Use before Copy Stage Files into Table. Safe to retry.',
    idempotent: true,
  },
  outputSchema: listStageFilesOutputSchema,
  auth: snowflakeAuth,
  props: {
    stage: Property.ShortText({
      displayName: 'Stage',
      description:
        'Named stage, optionally qualified, e.g. `MY_DB.PUBLIC.MY_STAGE` (a leading @ is optional).',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Optional folder inside the stage, e.g. `exports/2026/`.',
      required: false,
    }),
    pattern: Property.ShortText({
      displayName: 'Pattern',
      description:
        'Optional regular expression on the full file path, e.g. `.*\\.csv`.',
      required: false,
    }),
    limit: aiProps.limit(100, 1000),
  },
  async run(context) {
    const { stage, path, pattern, limit } = context.propsValue;
    const max = boundedInteger({
      value: limit,
      defaultValue: 100,
      min: 1,
      max: 1000,
      label: 'Limit',
    });
    let sql = `LIST ${stageReference({ stage, path })}`;
    if (pattern && pattern.trim() !== '')
      sql += ` PATTERN = ${sqlString(pattern.trim())}`;
    return withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        listShow({
          session,
          sql,
          limit: max,
          map: (row) => ({
            name: row['name'] ?? null,
            size: row['size'] ?? null,
            md5: row['md5'] ?? null,
            last_modified: row['last_modified'] ?? null,
          }),
        }),
    });
  },
});
