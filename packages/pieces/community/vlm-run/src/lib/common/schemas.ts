import z from 'zod';

const imageDomains = [
  'image.classification',
  'image.caption',
  'image.tv-news',
  'image.q-and-a',
] as const;

const documentDomains = [
  'document.bank-statement',
  'document.classification',
  'document.invoice',
  'document.markdown',
  'document.q-and-a',
  'document.receipt',
  'document.resume',
  'document.us-drivers-license',
  'document.utility-bill',
] as const;

const videoDomains = [
    'video.transcription',
    'video.transcription-summary',
    'video.product-demo-summary',
    'video.conferencing-summary',
    'video.podcast-summary',
    'video.summary',
    'video.dashcam-analytics'
] as const;

const apFileSchema = z.object({
    filename: z.string(),
    data: z.instanceof(Buffer),
    extension: z.string()
});
// Schemas
export const analyzeAudioSchema = {
    audio: apFileSchema,
};

export const analyzeImageSchema = {
    image: z.string().url(),
    domain: z.enum(imageDomains)
};

export const analyzeDocumentSchema = {
    document: apFileSchema,
    domain: z.enum(documentDomains)
};

export const analyzeVideoSchema = {
    video: apFileSchema,
    domain: z.enum(videoDomains)
};

export const getFileSchema = {
    fileId: z.string()
};
