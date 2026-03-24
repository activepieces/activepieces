import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import {
  configureConnection,
  connect,
  destroy,
  execute,
  snowflakeCommonProps,
  SnowflakeAuthValue,
} from '../common';

export const loadDataFromStageAction = createAction({
  name: 'load_data_from_stage',
  displayName: 'Load Data from Stage',
  description:
    'Load data into a Snowflake table from a named internal or external stage using COPY INTO.',
  auth: snowflakeAuth,
  props: {
    database: snowflakeCommonProps.database,
    schema: snowflakeCommonProps.schema,
    table: snowflakeCommonProps.table,
    stage_path: Property.ShortText({
      displayName: 'Stage Path',
      description:
        'The stage path to load from. For internal stages use `@stage_name` or `@schema.stage_name/path/`. ' +
        'For external (S3/GCS/Azure) stages use `@schema.stage_name/prefix/`. ' +
        'Example: `@my_stage/data/`',
      required: true,
    }),
    file_format_type: Property.StaticDropdown({
      displayName: 'File Format',
      description: 'The format of the files in the stage.',
      required: true,
      defaultValue: 'CSV',
      options: {
        options: [
          { label: 'CSV', value: 'CSV' },
          { label: 'JSON', value: 'JSON' },
          { label: 'PARQUET', value: 'PARQUET' },
          { label: 'AVRO', value: 'AVRO' },
          { label: 'ORC', value: 'ORC' },
          { label: 'XML', value: 'XML' },
        ],
      },
    }),
    file_pattern: Property.ShortText({
      displayName: 'File Pattern',
      description:
        'Optional regex pattern to filter files in the stage (e.g. `.*\\.csv` to load only CSV files).',
      required: false,
    }),
    skip_header: Property.Number({
      displayName: 'Skip Header Rows',
      description:
        'Number of header rows to skip at the top of each CSV file (CSV only). Defaults to 0.',
      required: false,
      defaultValue: 0,
    }),
    error_on_column_count_mismatch: Property.Checkbox({
      displayName: 'Error on Column Count Mismatch',
      description:
        'If enabled, COPY fails when the number of columns in the file does not match the table.',
      required: false,
      defaultValue: true,
    }),
    on_error: Property.StaticDropdown({
      displayName: 'On Error',
      description: 'What to do when a row fails to load.',
      required: false,
      defaultValue: 'ABORT_STATEMENT',
      options: {
        options: [
          { label: 'Abort statement (default)', value: 'ABORT_STATEMENT' },
          { label: 'Continue (skip bad rows)', value: 'CONTINUE' },
          { label: 'Skip file', value: 'SKIP_FILE' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      table,
      stage_path,
      file_format_type,
      file_pattern,
      skip_header,
      error_on_column_count_mismatch,
      on_error,
    } = context.propsValue;

    let fileFormatClause = `TYPE = '${file_format_type}'`;
    if (skip_header)
      fileFormatClause += ` SKIP_HEADER = ${Number(skip_header)}`;
    if (error_on_column_count_mismatch !== undefined) {
      fileFormatClause += ` ERROR_ON_COLUMN_COUNT_MISMATCH = ${
        error_on_column_count_mismatch ? 'TRUE' : 'FALSE'
      }`;
    }

    let sql = `COPY INTO ${table} FROM ${stage_path} FILE_FORMAT = (${fileFormatClause})`;
    if (file_pattern) sql += ` PATTERN = '${file_pattern.replace(/'/g, "''")}'`;
    sql += ` ON_ERROR = '${on_error ?? 'ABORT_STATEMENT'}'`;

    const connection = configureConnection(context.auth as SnowflakeAuthValue);
    await connect(connection);
    try {
      const result = await execute(connection, sql, []);
      if (!result || result.length === 0) {
        return { success: true, files_processed: 0, rows_loaded: 0 };
      }

      const summary = (result as Record<string, unknown>[]).map((row) => ({
        file: row['file'] ?? null,
        status: row['status'] ?? null,
        rows_parsed: row['rows_parsed'] ?? null,
        rows_loaded: row['rows_loaded'] ?? null,
        error_limit: row['error_limit'] ?? null,
        errors_seen: row['errors_seen'] ?? null,
        first_error: row['first_error'] ?? null,
      }));

      const totalLoaded = summary.reduce(
        (sum, r) => sum + (Number(r.rows_loaded) || 0),
        0
      );

      return {
        success: true,
        files_processed: summary.length,
        rows_loaded: totalLoaded,
        files: summary,
      };
    } finally {
      await destroy(connection);
    }
  },
});
