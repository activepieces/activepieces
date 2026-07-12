import { createAction, Property } from '@activepieces/pieces-framework';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify/sync';

export const chunkCsvFileAction = createAction({
  name: 'chunk_csv_file',
  displayName: 'Chunk CSV File',
  description:
    'Stream a large CSV file and split it into smaller CSV files of N rows each, without loading the whole file into memory.',
  errorHandlingOptions: {
    continueOnFailure: { hide: true },
    retryOnFailure: { hide: true },
  },
  props: {
    file: Property.File({
      displayName: 'CSV File',
      description: 'The (large) CSV file to split.',
      required: true,
      stream: true,
    }),
    rows_per_chunk: Property.Number({
      displayName: 'Rows per file',
      description: 'Number of data rows in each output file.',
      required: true,
      defaultValue: 1000,
    }),
    has_headers: Property.Checkbox({
      displayName: 'First row is a header',
      description: 'Repeat the header row at the top of every output file.',
      required: true,
      defaultValue: true,
    }),
    delimiter: Property.StaticDropdown({
      displayName: 'Delimiter',
      required: true,
      defaultValue: ',',
      options: {
        options: [
          { label: 'Comma', value: ',' },
          { label: 'Tab', value: '\t' },
          { label: 'Semicolon', value: ';' },
        ],
      },
    }),
  },
  async run(context) {
    const { file, rows_per_chunk, has_headers, delimiter } = context.propsValue;
    if (rows_per_chunk < 1) {
      throw new Error('Rows per file must be at least 1');
    }

    const baseName = file.filename.replace(/\.csv$/i, '') || 'chunk';
    const parser = (await file.stream()).pipe(parse({ delimiter }));

    const chunks: string[] = [];
    let header: string[] | undefined;
    let buffer: string[][] = [];

    const flush = async () => {
      if (buffer.length === 0) {
        return;
      }
      const rows = header ? [header, ...buffer] : buffer;
      const url = await context.files.writeStream({
        fileName: `${baseName}-part-${chunks.length + 1}.csv`,
        stream: singleChunkStream(stringify(rows, { delimiter })),
      });
      chunks.push(url);
      buffer = [];
    };

    for await (const record of parser) {
      if (has_headers && header === undefined) {
        header = record;
        continue;
      }
      buffer.push(record);
      if (buffer.length >= rows_per_chunk) {
        await flush();
      }
    }
    await flush();

    return { files: chunks, chunkCount: chunks.length };
  },
});

async function* singleChunkStream(content: string): AsyncIterable<Uint8Array> {
  yield new Uint8Array(Buffer.from(content, 'utf-8'));
}
