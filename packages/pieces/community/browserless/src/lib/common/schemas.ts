import z from 'zod';

const baseSchema = {
    addScriptTag: z.array(
    z.object({
      url: z.string().url().optional(),
      path: z.string().optional(),
      content: z.string().optional(),
      type: z.string().optional(),
      id: z.string().optional(),
    })
  ),
  addStyleTag: z.object({
    url: z.string().url().optional(),
    path: z.string().optional(),
    content: z.string().optional(),
  }),
  authenticate: z.object({
    username: z.string().optional(),
    password: z.string().optional(),
  }),
  viewPort: z.object({
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
    deviceScaleFactor: z.number().min(1).optional(),
    isMobile: z.boolean().optional(),
    hasTouch: z.boolean().optional(),
    isLandscape: z.boolean().optional(),
  }),
}

export const captureScreenshot = {
  url: z.string().url().optional(),
  html: z.string().optional(),
  optimizeForSpeed: z.boolean().optional(),
  type: z.enum(['jpeg', 'png', 'webp']).optional(),
  fromSurface: z.boolean().optional(),
  fullPage: z.boolean().optional(),
  omitBackground: z.boolean().optional(),
  path: z.string().optional(),
  clip: z
    .object({
      width: z.number().min(0),
      height: z.number().min(0),
      x: z.number().min(0),
      y: z.number().min(0),
      scale: z.number().min(0).optional(),
    })
    .optional(),
  encoding: z.enum(['base64', 'binary']).optional(),
  captureBeyondViewport: z.boolean().optional(),
  ...baseSchema
};

export const generatePdf = {
  url: z.string().url().optional(),
  html: z.string().optional(),
  scale: z.number().min(0.1).max(2).optional(),
  displayHeaderFooter: z.boolean().optional(),
  headerTemplate: z.string().optional(),
  footerTemplate: z.string().optional(),
  printBackground: z.boolean().optional(),
  landscape: z.boolean().optional(),
  pageRanges: z.string().optional(),
  format: z.enum(['A0', 'A1', 'A2', 'A3', 'A4', 'Ledger', 'Legal', 'Letter', 'Tabloid']).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  waitForFonts: z.boolean().optional(),
  ...baseSchema
};
