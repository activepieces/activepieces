export function toImageReplacements(images: unknown): ImageReplacement[] {
  if (Array.isArray(images)) {
    return images.flatMap((row) => {
      if (typeof row !== 'object' || row === null || !('imageObjectId' in row) || !('url' in row)) {
        return [];
      }
      return [{ imageObjectId: String(row.imageObjectId), url: String(row.url) }];
    });
  }
  if (typeof images === 'object' && images !== null) {
    return Object.entries(images).map(([imageObjectId, url]) => ({ imageObjectId, url: String(url) }));
  }
  return [];
}

export type ImageReplacement = {
  imageObjectId: string;
  url: string;
};
