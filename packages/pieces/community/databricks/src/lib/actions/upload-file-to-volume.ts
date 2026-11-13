import { randomUUID } from 'node:crypto';

import { createAction, Property } from '@activepieces/pieces-framework';

import { databricksAuth } from '../auth';
import { databricksApi } from '../common/api';
import { databricksProps } from '../common/props';
import { databricksUtils } from '../common/utils';
import { loadFileOutputSchema } from '../output-schemas';

import type { DatabricksColumn, DatabricksFileColumn } from '../common/types';

const FILE_FORMATS: Record<
  string,
  {
    sqlFormat: string;
    readOptions: Record<string, string>;
    typeOptions: Record<string, string>;
  }
> = {
  CSV: {
    sqlFormat: 'CSV',
    readOptions: { header: 'true', multiLine: 'true', escape: '"' },
    typeOptions: { inferSchema: 'false' },
  },
  JSON_LINES: {
    sqlFormat: 'JSON',
    readOptions: { multiLine: 'false' },
    typeOptions: {},
  },
  JSON_ARRAY: {
    sqlFormat: 'JSON',
    readOptions: { multiLine: 'true' },
    typeOptions: {},
  },
};

const FILE_FORMAT_OPTIONS = [
  { label: 'CSV (first row is the header)', value: 'CSV' },
  { label: 'JSON (one object per line)', value: 'JSON_LINES' },
  {
    label: 'JSON (an array of objects, or one object over several lines)',
    value: 'JSON_ARRAY',
  },
];

export const uploadFileToVolumeAction = createAction({
  auth: databricksAuth,
  name: 'upload_file_to_volume',
  classification: 'WRITE',
  displayName: 'Upload File to Volume',
  description:
    'Uploads a file to a Unity Catalog volume and, optionally, loads it into a table with COPY INTO.',
  audience: 'both',
  aiMetadata: {
    description:
      'Upload a file to a Databricks Unity Catalog volume and, when a table is chosen, load its CSV or JSON rows into that table with COPY INTO. Use this for bulk file loads; for a few rows built in the flow use Insert Multiple Rows. Each call stores the file under a new name and loads it again, so retries duplicate rows.',
    idempotent: false,
  },
  props: {
    catalogName: databricksProps.catalogName({ required: true }),
    schemaName: databricksProps.schemaName({ required: true }),
    volumeName: databricksProps.volumeName({ required: true }),
    file: Property.File({
      displayName: 'File',
      description:
        'The file to upload, e.g. a CSV or JSON file from an FTP, email or HTTP step.',
      required: true,
    }),
    folder: Property.ShortText({
      displayName: 'Folder',
      description:
        'Optional folder inside the volume, e.g. imports/orders. It is created if it does not exist.',
      required: false,
    }),
    tableName: databricksProps.tableName({
      required: false,
      displayName: 'Load into Table',
      description:
        'Optional. A table in the same catalog and schema to load the file into with COPY INTO. Leave empty to only upload the file.',
    }),
    warehouseId: databricksProps.warehouseId({
      required: false,
      description:
        'The SQL warehouse that runs COPY INTO. Required when Load into Table is set.',
    }),
    fileFormat: Property.StaticDropdown({
      displayName: 'File Format',
      description: 'How the file is read when it is loaded into the table.',
      required: false,
      defaultValue: 'CSV',
      options: { options: FILE_FORMAT_OPTIONS },
    }),
    shouldMergeSchema: Property.Checkbox({
      displayName: 'Add New Columns',
      description:
        'When the file has columns the table does not, add them to the table instead of failing.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: loadFileOutputSchema,
  async run(context) {
    const {
      catalogName,
      schemaName,
      volumeName,
      file,
      folder,
      tableName,
      warehouseId,
      fileFormat,
      shouldMergeSchema,
    } = context.propsValue;
    if (tableName && !warehouseId) {
      throw new Error(
        'Select a SQL warehouse to load the file into the table.'
      );
    }
    const format = FILE_FORMATS[fileFormat ?? 'CSV'];
    if (!format) {
      throw new Error(`Unsupported file format: ${fileFormat}`);
    }
    const fileName = `${Date.now()}-${randomUUID()}-${file.filename.replace(
      /[^A-Za-z0-9._-]/g,
      '_'
    )}`;
    const folderSegments = (folder ?? '')
      .split('/')
      .filter((segment) => segment.trim() !== '');
    const directory = [
      '',
      'Volumes',
      catalogName,
      schemaName,
      volumeName,
      ...folderSegments,
    ].join('/');
    const filePath = `${directory}/${fileName}`;
    await databricksApi.uploadFile({
      auth: context.auth,
      path: filePath,
      data: file.data,
    });
    if (!tableName || !warehouseId) {
      return { filePath };
    }
    const [table, fileColumns] = await Promise.all([
      databricksApi.getTable({
        auth: context.auth,
        catalogName,
        schemaName,
        tableName,
      }),
      databricksApi.getFileColumns({
        auth: context.auth,
        warehouseId,
        path: filePath,
        format: format.sqlFormat.toLowerCase(),
        options: format.readOptions,
      }),
    ]);
    if (fileColumns.length === 0) {
      throw new Error('The file has no columns to load.');
    }
    const selectList = fileColumns
      .map((source) => {
        const target = (table.columns ?? []).find(
          (column) => column.name.toLowerCase() === source.name.toLowerCase()
        );
        return target
          ? `${castFileColumn({
              source,
              target,
            })} AS ${databricksUtils.quoteIdentifier({ name: target.name })}`
          : databricksUtils.quoteIdentifier({ name: source.name });
      })
      .join(', ');
    const formatOptions = {
      ...format.readOptions,
      ...format.typeOptions,
      ...(shouldMergeSchema ? { mergeSchema: 'true' } : {}),
    };
    const statement = [
      `COPY INTO ${databricksUtils.tableRef({
        catalogName,
        schemaName,
        tableName,
      })}`,
      `FROM (SELECT ${selectList} FROM ${databricksUtils.stringLiteral({
        value: directory,
      })})`,
      `FILEFORMAT = ${format.sqlFormat}`,
      `FILES = (${databricksUtils.stringLiteral({ value: fileName })})`,
      `FORMAT_OPTIONS (${toOptionList({ options: formatOptions })})`,
      shouldMergeSchema ? `COPY_OPTIONS ('mergeSchema' = 'true')` : '',
    ]
      .filter((line) => line !== '')
      .join(' ');
    const result = await databricksApi.executeWriteStatement({
      auth: context.auth,
      warehouseId,
      statement,
    });
    return { filePath, ...result };
  },
});

function castFileColumn({
  source,
  target,
}: {
  source: DatabricksFileColumn;
  target: DatabricksColumn;
}): string {
  const name = databricksUtils.quoteIdentifier({ name: source.name });
  const sourceType = (source.type_name ?? 'STRING').toUpperCase();
  const targetType = (target.type_name ?? 'STRING').toUpperCase();
  if (COMPLEX_TYPES.includes(sourceType)) {
    const json = `to_json(${name})`;
    return targetType === 'STRING'
      ? json
      : databricksUtils.convertToColumnType({
          column: target,
          expression: json,
        });
  }
  if (targetType === 'STRING') {
    return `CAST(${name} AS STRING)`;
  }
  return databricksUtils.convertToColumnType({
    column: target,
    expression: name,
  });
}

function toOptionList({
  options,
}: {
  options: Record<string, string>;
}): string {
  return Object.entries(options)
    .map(
      ([key, value]) =>
        `${databricksUtils.stringLiteral({
          value: key,
        })} = ${databricksUtils.stringLiteral({ value })}`
    )
    .join(', ');
}

const COMPLEX_TYPES = ['ARRAY', 'MAP', 'STRUCT'];
