export function toImageReplacements(images: unknown): ImageReplacement[] {
  if (Array.isArray(images)) {
    return images.flatMap((row) => {
      if (typeof row !== 'object' || row === null) {
        return [];
      }
      if (isEditorRow(row)) {
        return hasBothColumns(row) ? [{ imageObjectId: String(row.imageObjectId), url: String(row.url) }] : [];
      }
      return fromDictionary(row);
    });
  }
  if (typeof images === 'object' && images !== null) {
    return fromDictionary(images);
  }
  return [];
}

function isEditorRow(row: object): boolean {
  return EDITOR_COLUMNS.some((column) => column in row);
}

function hasBothColumns(row: object): row is Record<EditorColumn, unknown> {
  return EDITOR_COLUMNS.every((column) => column in row);
}

function fromDictionary(dictionary: object): ImageReplacement[] {
  return Object.entries(dictionary).map(([imageObjectId, url]) => ({ imageObjectId, url: String(url) }));
}

const EDITOR_COLUMNS = ['imageObjectId', 'url'] as const;

type EditorColumn = (typeof EDITOR_COLUMNS)[number];

export type ImageReplacement = {
  imageObjectId: string;
  url: string;
};
