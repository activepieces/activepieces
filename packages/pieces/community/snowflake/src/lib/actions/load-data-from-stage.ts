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
        'Path to the Snowflake stage (a staging area that holds files before loading). ' +
        'For **internal stages**: use `@stage_name` or `@schema.stage_name/folder/`. ' +
        'For **external stages** (S3, GCS, Azure): use `@schema.stage_name/prefix/`. ' +
        'Example: `@my_stage/data/`. ' +
        'You can find your stage names under **Data → Databases → [your database] → Stages**.',
      required: true,
    }),
    file_format_type: Property.StaticDropdown({
      displayName: 'File Format',
      description: 'The file format of the data files in the stage.',
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
        'Optional regular expression to load only files whose names match the pattern (e.g. `.*\\.csv` loads only `.csv` files, `sales_2024.*` loads files that start with `sales_2024`). Leave empty to load all files in the stage path.',
      required: false,
    }),
    skip_header: Property.Number({
      displayName: 'Skip Header Rows',
      description:
        'Number of rows to skip at the top of each CSV file (e.g. `1` to skip a column-header row). Only applies to CSV files. Defaults to 0.',
      required: false,
      defaultValue: 0,
    }),
    error_on_column_count_mismatch: Property.Checkbox({
      displayName: 'Fail on Column Count Mismatch',
      description:
        'When enabled, the load fails if the number of columns in a file does not match the number of columns in the target table. Disable to allow files with fewer columns.',
      required: false,
      defaultValue: true,
    }),
    on_error: Property.StaticDropdown({
      displayName: 'On Error',
      description: 'What to do when a row fails validation during loading.',
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
