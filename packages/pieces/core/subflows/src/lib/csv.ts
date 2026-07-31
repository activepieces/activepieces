import { parse, Parser } from 'csv-parse';

export function createCsvParser({ delimiter }: { delimiter: string }): CsvParser {
  let headers: string[] = [];
  const parser = parse({
    delimiter,
    bom: true,
    relax_column_count: true,
    group_columns_by_name: true,
    columns: (header: string[]) => {
      headers = header;
      return header;
    },
    skip_empty_lines: true,
    trim: true,
  });
  return { parser, getHeaders: () => headers };
}

export type CsvRow = Record<string, string | string[]>;

export type CsvParser = {
  parser: Parser;
  getHeaders: () => string[];
};
