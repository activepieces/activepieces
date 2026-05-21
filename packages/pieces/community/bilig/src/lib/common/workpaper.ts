import type {
  PersistedWorkPaperDocument,
  RawCellContent,
  WorkPaper,
  WorkPaperCellAddress,
  WorkPaperCellRange,
  WorkPaperSheet,
  WorkPaperSheets,
} from '@bilig/headless';

type BiligRuntime = typeof import('@bilig/headless');
type JsonObject = Record<string, unknown>;
type JsonCell = string | number | boolean | null;

interface FormulaValidation {
  valid: boolean;
  formula: string;
  errors: string[];
}

interface ReadRangeParams {
  workpaper: unknown;
  sheet: string;
  range: string;
}

interface ReadCell {
  address: string;
  serialized: RawCellContent;
  formula?: string;
  value: unknown;
  scalarValue: unknown;
  displayValue: string;
}

interface ReadRangeResult {
  sheet: string;
  range: string;
  rows: ReadCell[][];
}

interface SetCellAndVerifyParams {
  workpaper: unknown;
  sheet: string;
  cell: string;
  value: string;
  readbackCell?: string;
  readbackSheet?: string;
  expectedReadback?: string;
}

interface SetCellAndVerifyResult {
  verified: boolean;
  updatedCell: string;
  readbackCell: string;
  changes: unknown[];
  readback: {
    value: unknown;
    scalarValue: unknown;
    displayValue: string;
  };
  expectedReadback?: string;
  workpaper: PersistedWorkPaperDocument;
}

const WORK_PAPER_DOCUMENT_FORMAT = 'bilig.headless.work-paper.document.v1';

let loadBiligRuntime = importBiligRuntime;

function createDemoWorkpaper(): PersistedWorkPaperDocument {
  return {
    format: WORK_PAPER_DOCUMENT_FORMAT,
    namedExpressions: [],
    sheets: [
      {
        name: 'Inputs',
        content: [
          ['Metric', 'Value'],
          ['Customers', 20],
          ['Average revenue', 1200],
        ],
      },
      {
        name: 'Summary',
        content: [
          ['Metric', 'Value'],
          ['Revenue', '=Inputs!B2*Inputs!B3'],
        ],
      },
    ],
  };
}

function setBiligRuntimeLoaderForTesting(loader: () => Promise<BiligRuntime>): void {
  loadBiligRuntime = loader;
}

async function importBiligRuntime(): Promise<BiligRuntime> {
  // Preserve native dynamic import after CommonJS compilation because @bilig/headless is ESM-only.
  const runtime: unknown = await Function('return import("@bilig/headless")')();
  if (!isBiligRuntime(runtime)) {
    throw new Error('Unable to load the Bilig WorkPaper runtime.');
  }
  return runtime;
}

async function validateFormula(formula: string): Promise<FormulaValidation> {
  const trimmedFormula = formula.trim();
  const errors: string[] = [];
  const runtime = await loadBiligRuntime();
  const workbook = runtime.WorkPaper.buildEmpty();

  try {
    const valid = workbook.validateFormula(trimmedFormula);
    if (!valid) {
      errors.push('formula_invalid');
    }
    return {
      valid,
      formula: trimmedFormula,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      formula: trimmedFormula,
      errors: [messageOf(error, 'formula_invalid')],
    };
  }
}

async function readRange(params: ReadRangeParams): Promise<ReadRangeResult> {
  const runtime = await loadBiligRuntime();
  const workbook = await createWorkbook({ runtime, input: params.workpaper });
  const defaultSheetId = requireSheet({ workbook, sheetName: params.sheet });
  const range = requireRange({ workbook, range: params.range, defaultSheetId });
  const sheetName = workbook.getSheetName(range.start.sheet) ?? params.sheet;
  const rows: ReadCell[][] = [];

  for (let rowIndex = range.start.row; rowIndex <= range.end.row; rowIndex += 1) {
    const row: ReadCell[] = [];
    for (let colIndex = range.start.col; colIndex <= range.end.col; colIndex += 1) {
      row.push(readCell({ workbook, address: { sheet: range.start.sheet, row: rowIndex, col: colIndex } }));
    }
    rows.push(row);
  }

  return {
    sheet: sheetName,
    range: workbook.simpleCellRangeToString(range, range.start.sheet),
    rows,
  };
}

async function setCellAndVerify(params: SetCellAndVerifyParams): Promise<SetCellAndVerifyResult> {
  const runtime = await loadBiligRuntime();
  const workbook = await createWorkbook({ runtime, input: params.workpaper });
  const sheetId = requireSheet({ workbook, sheetName: params.sheet });
  const address = requireCellAddress({ workbook, sheetName: params.sheet, address: params.cell, defaultSheetId: sheetId });
  const readbackSheetId = requireSheet({
    workbook,
    sheetName: normalizeOptionalString(params.readbackSheet) ?? params.sheet,
  });
  const readbackAddress = requireCellAddress({
    workbook,
    sheetName: normalizeOptionalString(params.readbackSheet) ?? params.sheet,
    address: normalizeOptionalString(params.readbackCell) ?? params.cell,
    defaultSheetId: readbackSheetId,
  });
  const changes = workbook.setCellContents(address, parseCellInput(params.value));
  const readback = readCellValue({ workbook, address: readbackAddress });
  const expectedReadback = normalizeOptionalString(params.expectedReadback);

  return {
    verified: expectedReadback === undefined || readback.displayValue === expectedReadback,
    updatedCell: workbook.simpleCellAddressToString(address, { includeSheetName: true }),
    readbackCell: workbook.simpleCellAddressToString(readbackAddress, { includeSheetName: true }),
    changes,
    readback,
    expectedReadback,
    workpaper: runtime.exportWorkPaperDocument(workbook, { includeConfig: true }),
  };
}

async function createWorkbook(args: { runtime: BiligRuntime; input: unknown }): Promise<WorkPaper> {
  if (!isRecord(args.input)) {
    throw new Error('WorkPaper JSON must be an object.');
  }

  if (args.runtime.isPersistedWorkPaperDocument(args.input)) {
    return args.runtime.createWorkPaperFromDocument(args.input);
  }

  if (args.input['format'] === WORK_PAPER_DOCUMENT_FORMAT) {
    return args.runtime.createWorkPaperFromDocument(args.runtime.parseWorkPaperDocument(JSON.stringify(args.input)));
  }

  return args.runtime.WorkPaper.buildFromSheets(normalizeLegacySheets(args.input));
}

function normalizeLegacySheets(input: JsonObject): WorkPaperSheets {
  const rawSheets = input['sheets'];
  if (!isRecord(rawSheets)) {
    throw new Error('WorkPaper JSON must contain a sheets object or a persisted WorkPaper document.');
  }

  const sheets: WorkPaperSheets = {};
  for (const [sheetName, rawSheet] of Object.entries(rawSheets)) {
    const sheetInput = isRecord(rawSheet) ? rawSheet['cells'] ?? rawSheet['data'] : rawSheet;
    sheets[sheetName] = normalizeSheet(sheetInput, sheetName);
  }
  return sheets;
}

function normalizeSheet(input: unknown, sheetName: string): WorkPaperSheet {
  if (!Array.isArray(input)) {
    throw new Error(`Sheet "${sheetName}" must be a two-dimensional array.`);
  }

  return input.map((row, rowIndex) => {
    if (!Array.isArray(row)) {
      throw new Error(`Sheet "${sheetName}" row ${rowIndex + 1} must be an array.`);
    }
    return row.map((cell) => normalizeCell(cell));
  });
}

function normalizeCell(input: unknown): RawCellContent {
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean' || input === null) {
    return input;
  }
  throw new Error('WorkPaper cells must be JSON scalar values.');
}

function readCell(args: { workbook: WorkPaper; address: WorkPaperCellAddress }): ReadCell {
  const readback = readCellValue(args);
  return {
    address: args.workbook.simpleCellAddressToString(args.address, args.address.sheet),
    serialized: args.workbook.getCellSerialized(args.address),
    formula: args.workbook.getCellFormula(args.address),
    ...readback,
  };
}

function readCellValue(args: { workbook: WorkPaper; address: WorkPaperCellAddress }): {
  value: unknown;
  scalarValue: unknown;
  displayValue: string;
} {
  const value = args.workbook.getCellValue(args.address);
  return {
    value: toJsonValue(value),
    scalarValue: cellValueToScalar(value),
    displayValue: args.workbook.getCellDisplayValue(args.address),
  };
}

function requireSheet(args: { workbook: WorkPaper; sheetName: string }): number {
  const sheetId = args.workbook.getSheetId(args.sheetName);
  if (sheetId === undefined) {
    throw new Error(`Expected sheet "${args.sheetName}" to exist.`);
  }
  return sheetId;
}

function requireRange(args: {
  workbook: WorkPaper;
  range: string;
  defaultSheetId: number;
}): WorkPaperCellRange {
  const range = args.workbook.simpleCellRangeFromString(args.range, args.defaultSheetId);
  if (range === undefined) {
    throw new Error(`Invalid WorkPaper range: ${args.range}`);
  }
  if (range.start.sheet !== range.end.sheet) {
    throw new Error('Cross-sheet ranges are not supported by this action.');
  }
  return range;
}

function requireCellAddress(args: {
  workbook: WorkPaper;
  sheetName: string;
  address: string;
  defaultSheetId: number;
}): WorkPaperCellAddress {
  const address = args.workbook.simpleCellAddressFromString(args.address, args.defaultSheetId);
  if (address === undefined) {
    throw new Error(`Invalid cell address: ${args.sheetName}!${args.address}`);
  }
  if (address.sheet !== args.defaultSheetId) {
    const resolvedSheetName = args.workbook.getSheetName(address.sheet) ?? `sheet ${address.sheet}`;
    throw new Error(`Expected cell address on sheet "${args.sheetName}", got "${resolvedSheetName}".`);
  }
  return address;
}

function parseCellInput(value: string): RawCellContent {
  const trimmedValue = value.trim();
  if (trimmedValue.startsWith('=')) {
    return trimmedValue;
  }
  if (trimmedValue.length === 0) {
    return '';
  }

  try {
    const parsed: unknown = JSON.parse(trimmedValue);
    if (isJsonCell(parsed)) {
      return parsed;
    }
  } catch {
    return trimmedValue;
  }

  return trimmedValue;
}

function cellValueToScalar(value: unknown): unknown {
  if (!isRecord(value) || typeof value['tag'] !== 'number') {
    return value;
  }
  if (value['tag'] === 0) {
    return null;
  }
  if ('value' in value) {
    return value['value'];
  }
  return toJsonValue(value);
}

function toJsonValue(value: unknown): unknown {
  const jsonValue: unknown = JSON.parse(JSON.stringify(value));
  return jsonValue;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }
  return value.trim();
}

function isJsonCell(value: unknown): value is JsonCell {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null;
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBiligRuntime(value: unknown): value is BiligRuntime {
  if (!isRecord(value) || !isRecord(value['WorkPaper'])) {
    return false;
  }
  return (
    typeof value['createWorkPaperFromDocument'] === 'function' &&
    typeof value['exportWorkPaperDocument'] === 'function' &&
    typeof value['isPersistedWorkPaperDocument'] === 'function' &&
    typeof value['parseWorkPaperDocument'] === 'function' &&
    typeof value['WorkPaper']['buildEmpty'] === 'function' &&
    typeof value['WorkPaper']['buildFromSheets'] === 'function'
  );
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const biligWorkpaperUtils = {
  createDemoWorkpaper,
  readRange,
  setCellAndVerify,
  validateFormula,
};

export const biligWorkpaperTestUtils = {
  setBiligRuntimeLoaderForTesting,
};
