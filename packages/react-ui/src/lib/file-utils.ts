import { assertNotNullOrUndefined, File } from '@activepieces/shared';

export const fileUtils = {
  getIdFromUrl: (url: string) => {
    return url.split('file://')[1];
  },
  isDbFile: (url: string) => {
    return url.startsWith('file://');
  },
  fileIdUrl: (fileId: string) => {
    return `file://${fileId}`;
  },
  fileToBase64: (file: File): string => {
    const uint8Array = new Uint8Array((file.data as any).data);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    assertNotNullOrUndefined(file.metadata?.mimetype, 'Mimetype is required');
    return `data:${file.metadata.mimetype};base64,${base64}`;
  },
};
