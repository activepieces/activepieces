import { createAction, Property } from '@activepieces/pieces-framework';

import { databricksAuth } from '../auth';
import { databricksApi } from '../common/api';
import { databricksProps } from '../common/props';
import { databricksUtils } from '../common/utils';
import { loadFileOutputSchema } from '../output-schemas';

const FILE_FORMATS: Record<
  string,
  { sqlFormat: string; options: Record<string, string> }
> = {
  CSV: { sqlFormat: 'CSV', options: { header: 'true', inferSchema: 'true' } },
  JSON_LINES: { sqlFormat: 'JSON', options: { multiLine: 'false' } },
  JSON_ARRAY: { sqlFormat: 'JSON', options: { multiLine: 'true' } },
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
    const fileName = `${Date.now()}-${file.filename.replace(
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
    if (!tableName) {
      return { filePath };
    }
    if (!warehouseId) {
      throw new Error(
        'Select a SQL warehouse to load the file into the table.'
      );
    }
    const format = FILE_FORMATS[fileFormat ?? 'CSV'];
    if (!format) {
      throw new Error(`Unsupported file format: ${fileFormat}`);
    }
    const formatOptions = {
      ...format.options,
      ...(shouldMergeSchema ? { mergeSchema: 'true' } : {}),
    };
    const statement = [
      `COPY INTO ${databricksUtils.tableRef({
        catalogName,
        schemaName,
        tableName,
      })}`,
      `FROM ${databricksUtils.stringLiteral({ value: directory })}`,
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
