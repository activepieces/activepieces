import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import { aiProps } from '../../common/ai-props';
import { mapCopyFile } from '../../common/mappers';
import { copyIntoOutputSchema } from '../../common/output-schemas';
import {
  buildCopyInto,
  FILE_FORMAT_TYPES,
  ON_ERROR_VALUES,
  stageReference,
} from '../../common/stage';

export const copyStageIntoTableAction = createAction({
  name: 'copy_stage_into_table',
  classification: 'WRITE',
  displayName: 'Copy Stage Files into Table',
  description: 'Load files from a named stage into a table (COPY INTO).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Loads files from a named stage path into an existing table with COPY INTO and returns per-file status and rows loaded. Snowflake skips files it already loaded into this table in the last 64 days, but new files in the path are loaded on a retry. Use List Stage Files first.',
    idempotent: false,
  },
  outputSchema: copyIntoOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(
      'Target table, optionally qualified as DATABASE.SCHEMA.TABLE.'
    ),
    stage: Property.ShortText({
      displayName: 'Stage',
      description:
        'Named stage, optionally qualified, e.g. `MY_DB.PUBLIC.MY_STAGE`.',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Optional folder or file inside the stage.',
      required: false,
    }),
    fileFormat: Property.StaticDropdown({
      displayName: 'File Format',
      required: true,
      defaultValue: 'CSV',
      options: {
        options: FILE_FORMAT_TYPES.map((value) => ({ label: value, value })),
      },
    }),
    pattern: Property.ShortText({
      displayName: 'Pattern',
      description:
        'Optional regular expression on file paths, e.g. `.*\\.csv`.',
      required: false,
    }),
    skipHeader: Property.Number({
      displayName: 'Skip Header Rows',
      description: 'CSV only: header rows to skip per file.',
      required: false,
      defaultValue: 0,
    }),
    onError: Property.StaticDropdown({
      displayName: 'On Error',
      required: false,
      defaultValue: 'ABORT_STATEMENT',
      options: {
        options: ON_ERROR_VALUES.map((value) => ({ label: value, value })),
      },
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const sql = buildCopyInto({
      table: p.table,
      stage: stageReference({ stage: p.stage, path: p.path }),
      fileFormat: p.fileFormat,
      pattern: p.pattern,
      skipHeader: p.skipHeader,
      onError: p.onError,
    });
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) => session.query({ sql }),
    });
    const files = result.rows
      .filter((row) => row['file'] !== undefined)
      .map(mapCopyFile);
    return {
      filesProcessed: files.length,
      rowsLoaded: files.reduce(
        (sum, file) => sum + (Number(file.rows_loaded) || 0),
        0
      ),
      files,
    };
  },
});
