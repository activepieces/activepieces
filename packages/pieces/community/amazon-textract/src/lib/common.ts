import { ApFile } from '@activepieces/pieces-framework';
import {
  TextractClient,
  Block,
  BlockType,
  RelationshipType,
  EntityType,
  ExpenseDocument,
  IdentityDocument,
} from '@aws-sdk/client-textract';

export interface TextractAuth {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface TextLine {
  text: string;
  confidence: number;
  pageNumber: number;
}

export interface FormField {
  key: string;
  value: string;
  keyConfidence: number;
  valueConfidence: number;
}

export interface TableCell {
  text: string;
  rowIndex: number;
  columnIndex: number;
  confidence: number;
  isHeader: boolean;
}

export interface TableResult {
  rows: TableCell[][];
  pageNumber: number;
}

export interface SignatureResult {
  pageNumber: number;
  confidence: number;
}

export interface QueryResult {
  query: string;
  answer: string;
  confidence: number;
  pageNumber: number;
}

export interface AnalyzeDocumentResult {
  rawText: string;
  lines: TextLine[];
  keyValuePairs: FormField[];
  tables: TableResult[];
  signatures: SignatureResult[];
  queryResults: QueryResult[];
  pageCount: number;
}

export interface DetectTextResult {
  rawText: string;
  lines: TextLine[];
  pageCount: number;
}

export interface ExpenseLineItem {
  description?: string;
  quantity?: string;
  unitPrice?: string;
  price?: string;
  productCode?: string;
}

export interface AnalyzeExpenseResult {
  vendor: { name?: string; address?: string; phone?: string };
  invoiceDate?: string;
  dueDate?: string;
  subtotal?: string;
  tax?: string;
  tip?: string;
  total?: string;
  invoiceNumber?: string;
  lineItems: ExpenseLineItem[];
  rawSummaryFields: { type: string; value: string; confidence: number }[];
}

export interface AnalyzeIDResult {
  documentType?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  dateOfBirth?: string;
  dateOfExpiry?: string;
  dateOfIssue?: string;
  idNumber?: string;
  address?: string;
  county?: string;
  placeOfBirth?: string;
  mrzCode?: string;
  allFields: { type: string; value: string; confidence: number }[];
}

// ─── Client Factory ───────────────────────────────────────────────────────────

export function createTextractClient(auth: TextractAuth): TextractClient {
  return new TextractClient({
    credentials: {
      accessKeyId: auth.accessKeyId,
      secretAccessKey: auth.secretAccessKey,
    },
    region: auth.region,
  });
}

// ─── Document Input Builder ───────────────────────────────────────────────────

export function buildDocumentInput(
  file: ApFile | null | undefined,
  s3Bucket: string | undefined,
  s3Key: string | undefined
): { Bytes?: Uint8Array; S3Object?: { Bucket: string; Name: string } } {
  if (file) {
    return { Bytes: new Uint8Array(file.data) };
  }
  if (s3Bucket && s3Key) {
    return { S3Object: { Bucket: s3Bucket, Name: s3Key } };
  }
  throw new Error(
    'You must provide either a file or an S3 bucket and key.'
  );
}

// ─── Block Tree Parsers ───────────────────────────────────────────────────────

function buildBlockIndex(blocks: Block[]): Map<string, Block> {
  const index = new Map<string, Block>();
  for (const block of blocks) {
    if (block.Id) index.set(block.Id, block);
  }
  return index;
}

function getChildIds(
  block: Block,
  relationshipType: RelationshipType
): string[] {
  return (
    block.Relationships?.filter((r) => r.Type === relationshipType)
      .flatMap((r) => r.Ids ?? []) ?? []
  );
}

function getBlockText(block: Block, blockIndex: Map<string, Block>): string {
  const wordIds = getChildIds(block, RelationshipType.CHILD);
  return wordIds
    .map((id) => blockIndex.get(id))
    .filter(
      (b): b is Block =>
        b !== undefined && b.BlockType === BlockType.WORD
    )
    .map((b) => b.Text ?? '')
    .join(' ')
    .trim();
}

function getValueBlock(
  keyBlock: Block,
  blockIndex: Map<string, Block>
): Block | undefined {
  const valueIds = getChildIds(keyBlock, RelationshipType.VALUE);
  for (const id of valueIds) {
    const block = blockIndex.get(id);
    if (
      block?.BlockType === BlockType.KEY_VALUE_SET &&
      block.EntityTypes?.includes(EntityType.VALUE)
    ) {
      return block;
    }
  }
  return undefined;
}

export function parseAnalysisBlocks(blocks: Block[]): AnalyzeDocumentResult {
  const blockIndex = buildBlockIndex(blocks);
  const lines: TextLine[] = [];
  const keyValuePairs: FormField[] = [];
  const tableMap = new Map<string, Block>();
  const signatures: SignatureResult[] = [];
  const queryResults: QueryResult[] = [];

  for (const block of blocks) {
    switch (block.BlockType) {
      case BlockType.LINE:
        lines.push({
          text: block.Text ?? '',
          confidence: block.Confidence ?? 0,
          pageNumber: block.Page ?? 1,
        });
        break;

      case BlockType.KEY_VALUE_SET:
        if (block.EntityTypes?.includes(EntityType.KEY)) {
          const valueBlock = getValueBlock(block, blockIndex);
          const keyText = getBlockText(block, blockIndex);
          const valueText = valueBlock
            ? getBlockText(valueBlock, blockIndex)
            : '';
          if (keyText) {
            keyValuePairs.push({
              key: keyText,
              value: valueText,
              keyConfidence: block.Confidence ?? 0,
              valueConfidence: valueBlock?.Confidence ?? 0,
            });
          }
        }
        break;

      case BlockType.TABLE:
        if (block.Id) tableMap.set(block.Id, block);
        break;

      case BlockType.SIGNATURE:
        signatures.push({
          pageNumber: block.Page ?? 1,
          confidence: block.Confidence ?? 0,
        });
        break;

      case BlockType.QUERY: {
        const queryText = block.Query?.Text ?? '';
        const answerIds = getChildIds(block, RelationshipType.ANSWER);
        let answerText = '';
        let answerConfidence = 0;
        for (const id of answerIds) {
          const answerBlock = blockIndex.get(id);
          if (answerBlock?.BlockType === BlockType.QUERY_RESULT) {
            answerText = answerBlock.Text ?? '';
            answerConfidence = answerBlock.Confidence ?? 0;
            break;
          }
        }
        if (queryText) {
          queryResults.push({
            query: queryText,
            answer: answerText,
            confidence: answerConfidence,
            pageNumber: block.Page ?? 1,
          });
        }
        break;
      }
    }
  }

  const tables: TableResult[] = [];
  for (const tableBlock of tableMap.values()) {
    const cellIds = getChildIds(tableBlock, RelationshipType.CHILD);
    const rowMap = new Map<number, TableCell[]>();

    for (const cellId of cellIds) {
      const cellBlock = blockIndex.get(cellId);
      if (!cellBlock || cellBlock.BlockType !== BlockType.CELL) continue;

      const rowIndex = cellBlock.RowIndex ?? 1;
      const colIndex = cellBlock.ColumnIndex ?? 1;
      const isHeader =
        cellBlock.EntityTypes?.includes(EntityType.COLUMN_HEADER) ?? false;
      const cellText = getBlockText(cellBlock, blockIndex);

      const cell: TableCell = {
        text: cellText,
        rowIndex,
        columnIndex: colIndex,
        confidence: cellBlock.Confidence ?? 0,
        isHeader,
      };

      if (!rowMap.has(rowIndex)) rowMap.set(rowIndex, []);
      rowMap.get(rowIndex)!.push(cell);
    }

    const sortedRows = Array.from(rowMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, cells]) => cells.sort((a, b) => a.columnIndex - b.columnIndex));

    tables.push({
      rows: sortedRows,
      pageNumber: tableBlock.Page ?? 1,
    });
  }

  const pageCount = Math.max(
    0,
    ...blocks
      .filter((b) => b.BlockType === BlockType.PAGE)
      .map((b) => b.Page ?? 0)
  );

  return {
    rawText: lines.map((l) => l.text).join('\n'),
    lines,
    keyValuePairs,
    tables,
    signatures,
    queryResults,
    pageCount: pageCount || 1,
  };
}

export function parseTextBlocks(blocks: Block[]): DetectTextResult {
  const lines: TextLine[] = [];

  for (const block of blocks) {
    if (block.BlockType === BlockType.LINE) {
      lines.push({
        text: block.Text ?? '',
        confidence: block.Confidence ?? 0,
        pageNumber: block.Page ?? 1,
      });
    }
  }

  const pageCount = Math.max(
    0,
    ...blocks
      .filter((b) => b.BlockType === BlockType.PAGE)
      .map((b) => b.Page ?? 0)
  );

  return {
    rawText: lines.map((l) => l.text).join('\n'),
    lines,
    pageCount: pageCount || 1,
  };
}

export function parseExpenseDocuments(
  expenseDocs: ExpenseDocument[]
): AnalyzeExpenseResult {
  const result: AnalyzeExpenseResult = {
    vendor: {},
    lineItems: [],
    rawSummaryFields: [],
  };

  for (const doc of expenseDocs) {
    for (const field of doc.SummaryFields ?? []) {
      const type = field.Type?.Text ?? '';
      const value = field.ValueDetection?.Text ?? '';
      const confidence = field.ValueDetection?.Confidence ?? 0;

      result.rawSummaryFields.push({ type, value, confidence });

      switch (type) {
        case 'VENDOR_NAME':
          result.vendor.name = value;
          break;
        case 'VENDOR_ADDRESS':
          result.vendor.address = value;
          break;
        case 'VENDOR_PHONE':
          result.vendor.phone = value;
          break;
        case 'INVOICE_RECEIPT_DATE':
          result.invoiceDate = value;
          break;
        case 'DUE_DATE':
          result.dueDate = value;
          break;
        case 'SUBTOTAL':
          result.subtotal = value;
          break;
        case 'TAX':
          result.tax = value;
          break;
        case 'TIP':
          result.tip = value;
          break;
        case 'TOTAL':
          result.total = value;
          break;
        case 'INVOICE_RECEIPT_ID':
          result.invoiceNumber = value;
          break;
      }
    }

    for (const group of doc.LineItemGroups ?? []) {
      for (const lineItem of group.LineItems ?? []) {
        const item: ExpenseLineItem = {};
        for (const field of lineItem.LineItemExpenseFields ?? []) {
          const type = field.Type?.Text ?? '';
          const value = field.ValueDetection?.Text ?? '';
          switch (type) {
            case 'ITEM':
              item.description = value;
              break;
            case 'QUANTITY':
              item.quantity = value;
              break;
            case 'UNIT_PRICE':
              item.unitPrice = value;
              break;
            case 'PRICE':
              item.price = value;
              break;
            case 'PRODUCT_CODE':
              item.productCode = value;
              break;
          }
        }
        result.lineItems.push(item);
      }
    }
  }

  return result;
}

export function parseIdentityDocuments(
  identityDocs: IdentityDocument[]
): AnalyzeIDResult {
  const result: AnalyzeIDResult = { allFields: [] };

  for (const doc of identityDocs) {
    for (const field of doc.IdentityDocumentFields ?? []) {
      const type = field.Type?.Text ?? '';
      const value = field.ValueDetection?.Text ?? '';
      const confidence = field.ValueDetection?.Confidence ?? 0;

      result.allFields.push({ type, value, confidence });

      switch (type) {
        case 'DOCUMENT_TYPE':
          result.documentType = value;
          break;
        case 'FIRST_NAME':
          result.firstName = value;
          break;
        case 'LAST_NAME':
          result.lastName = value;
          break;
        case 'MIDDLE_NAME':
          result.middleName = value;
          break;
        case 'SUFFIX':
          result.suffix = value;
          break;
        case 'DATE_OF_BIRTH':
          result.dateOfBirth = value;
          break;
        case 'EXPIRATION_DATE':
          result.dateOfExpiry = value;
          break;
        case 'DATE_OF_ISSUE':
          result.dateOfIssue = value;
          break;
        case 'DOCUMENT_NUMBER':
          result.idNumber = value;
          break;
        case 'ADDRESS':
          result.address = value;
          break;
        case 'COUNTY':
          result.county = value;
          break;
        case 'PLACE_OF_BIRTH':
          result.placeOfBirth = value;
          break;
        case 'MRZ_CODE':
          result.mrzCode = value;
          break;
      }
    }
  }

  return result;
}

// ─── Error Formatter ──────────────────────────────────────────────────────────

export function formatTextractError(error: unknown): string {
  const err = error as { name?: string; message?: string };
  const name = err.name ?? 'UnknownError';

  switch (name) {
    case 'ThrottlingException':
      return 'Request was throttled by AWS Textract. Please try again in a moment.';
    case 'AccessDeniedException':
      return 'Access denied. Ensure your AWS credentials have the required Textract permissions.';
    case 'InvalidS3ObjectException':
      return 'The specified S3 object could not be read. Check the bucket name, key, and permissions.';
    case 'UnsupportedDocumentException':
      return 'The document format or page count is not supported. Synchronous analysis supports JPEG, PNG, and single-page PDF or TIFF via S3. For multi-page PDFs, use the Start Document Analysis action.';
    case 'DocumentTooLargeException':
      return 'The document exceeds the maximum allowed size. Use S3 for large documents.';
    case 'BadDocumentException':
      return 'The document could not be read. Ensure the file is a valid image or PDF.';
    case 'ProvisionedThroughputExceededException':
      return 'You have exceeded your AWS Textract throughput quota. Please try again later.';
    case 'LimitExceededException':
      return 'You have reached the AWS Textract page limit for this document.';
    case 'InvalidJobIdException':
      return 'The specified job ID does not exist or belongs to a different account.';
    case 'InvalidKMSKeyException':
      return 'The KMS key is invalid or the account is not authorized to use it.';
    case 'HumanLoopQuotaExceededException':
      return 'The maximum number of active human review workflows has been exceeded. Please try again later.';
    case 'ValidationException':
      return `Validation error: ${err.message ?? 'Check your input parameters.'}`;
    default:
      return err.message ?? 'An unexpected error occurred.';
  }
}
