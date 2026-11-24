import type { ApFile } from '@activepieces/pieces-framework';

function audioForm({
  file,
  url,
  fields,
}: {
  file: ApFile | undefined;
  url: string | undefined;
  fields: Record<string, string | number | undefined>;
}): FormData {
  if ((file && url) || (!file && !url)) {
    throw new Error('Provide exactly one of Audio File and Audio URL.');
  }
  const formData = new FormData();
  if (file) {
    formData.append('file', new Blob([new Uint8Array(file.data)]), file.filename);
  }
  if (url) {
    formData.append('url', url);
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  }
  return formData;
}

export const groqUtils = { audioForm };
