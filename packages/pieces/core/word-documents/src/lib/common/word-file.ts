import { inflateRawSync } from 'node:zlib';

function isLegacyDoc(data: Buffer): boolean {
  return isCompoundFile(data) && !data.includes(ENCRYPTED_OOXML_STREAM_NAME);
}

function isEncryptedDocx(data: Buffer): boolean {
  return isCompoundFile(data) && data.includes(ENCRYPTED_OOXML_STREAM_NAME);
}

function isCompoundFile(data: Buffer): boolean {
  return data.subarray(0, CFB_SIGNATURE.length).equals(CFB_SIGNATURE);
}

function exceedsUnzippedLimits(data: Buffer): boolean {
  if (isZip64(data)) {
    return true;
  }
  const entries = listZipEntries(data);
  if (!entries) {
    return false;
  }
  const sizes = entries.reduce<{ xml: number; total: number } | undefined>(
    (totals, entry) => {
      if (!totals) {
        return undefined;
      }
      const isXml = XML_PART.test(entry.name);
      const budget = Math.min(
        MAX_UNZIPPED_BYTES - totals.total,
        isXml ? MAX_UNZIPPED_XML_BYTES - totals.xml : Infinity
      );
      const size = unzippedSize({ data, entry, budget });
      if (size === undefined) {
        return undefined;
      }
      return {
        xml: totals.xml + (isXml ? size : 0),
        total: totals.total + size,
      };
    },
    { xml: 0, total: 0 }
  );
  return (
    !sizes ||
    sizes.xml > MAX_UNZIPPED_XML_BYTES ||
    sizes.total > MAX_UNZIPPED_BYTES
  );
}

function isZip64(data: Buffer): boolean {
  const end = data.lastIndexOf(END_OF_CENTRAL_DIRECTORY);
  return (
    end >= 0 &&
    end + 22 <= data.length &&
    (data.readUInt16LE(end + 10) === ZIP64_COUNT_MARKER ||
      data.readUInt32LE(end + 16) === ZIP64_MARKER)
  );
}

function listZipEntries(data: Buffer): ZipEntry[] | undefined {
  const end = data.lastIndexOf(END_OF_CENTRAL_DIRECTORY);
  if (end < 0 || end + 22 > data.length) {
    return undefined;
  }
  const count = data.readUInt16LE(end + 10);
  const entries: ZipEntry[] = [];
  let offset = data.readUInt32LE(end + 16);
  for (let index = 0; index < count; index++) {
    if (
      offset + 46 > data.length ||
      data.readUInt32LE(offset) !== CENTRAL_DIRECTORY_ENTRY
    ) {
      return undefined;
    }
    const nameLength = data.readUInt16LE(offset + 28);
    entries.push({
      name: data.toString('utf8', offset + 46, offset + 46 + nameLength),
      method: data.readUInt16LE(offset + 10),
      compressedSize: data.readUInt32LE(offset + 20),
      localHeaderOffset: data.readUInt32LE(offset + 42),
    });
    offset +=
      46 +
      nameLength +
      data.readUInt16LE(offset + 30) +
      data.readUInt16LE(offset + 32);
  }
  return entries;
}

function unzippedSize({
  data,
  entry,
  budget,
}: {
  data: Buffer;
  entry: ZipEntry;
  budget: number;
}): number | undefined {
  const header = entry.localHeaderOffset;
  if (entry.compressedSize === ZIP64_MARKER || header + 30 > data.length) {
    return undefined;
  }
  const start =
    header +
    30 +
    data.readUInt16LE(header + 26) +
    data.readUInt16LE(header + 28);
  const compressed = data.subarray(start, start + entry.compressedSize);
  if (entry.method !== DEFLATE) {
    return compressed.length;
  }
  try {
    return inflateRawSync(compressed, {
      maxOutputLength: Math.max(budget, 0) + 1,
    }).length;
  } catch (error) {
    return error instanceof RangeError ? undefined : compressed.length;
  }
}

const CFB_SIGNATURE = Buffer.from([
  0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
]);
const ENCRYPTED_OOXML_STREAM_NAME = Buffer.from('EncryptionInfo', 'utf16le');
const END_OF_CENTRAL_DIRECTORY = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
const CENTRAL_DIRECTORY_ENTRY = 0x02014b50;
const ZIP64_MARKER = 0xffffffff;
const ZIP64_COUNT_MARKER = 0xffff;
const DEFLATE = 8;
const XML_PART = /\.(xml|rels)$/i;
const MAX_UNZIPPED_XML_BYTES = 8 * 1024 * 1024;
const MAX_UNZIPPED_BYTES = 200 * 1024 * 1024;

export const wordFile = {
  isLegacyDoc,
  isEncryptedDocx,
  exceedsUnzippedLimits,
  legacyDocMessage:
    'This is an older Word file (.doc), which is not supported yet. Open it in Word, save it as .docx, and try again.',
};

type ZipEntry = {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
};
