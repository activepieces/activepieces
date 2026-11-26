function resolveFileName({
  custom,
  original,
  extension,
}: {
  custom: string | undefined;
  original: string;
  extension: string | undefined;
}): string {
  const name = (custom ?? '').trim().replace(/\.+$/, '').trim();
  if (!name) {
    return original;
  }
  if (!extension) {
    return name;
  }
  const fileExtension = extension.toLowerCase();
  const suffix = name.includes('.')
    ? name.slice(name.lastIndexOf('.') + 1).toLowerCase()
    : '';
  if (suffix === fileExtension || keepsOwnSuffix({ suffix, fileExtension })) {
    return name;
  }
  return `${name}.${extension}`;
}

function keepsOwnSuffix({
  suffix,
  fileExtension,
}: {
  suffix: string;
  fileExtension: string;
}): boolean {
  const suffixFamily = FILE_TYPE_FAMILIES[suffix];
  if (!suffixFamily) {
    return false;
  }
  const fileFamily = FILE_TYPE_FAMILIES[fileExtension];
  return !fileFamily || fileFamily === suffixFamily;
}

const FILE_TYPE_FAMILIES: Record<string, string> = {
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  odt: 'document',
  rtf: 'document',
  epub: 'document',
  pages: 'document',
  txt: 'text',
  md: 'text',
  markdown: 'text',
  csv: 'text',
  tsv: 'text',
  json: 'text',
  jsonl: 'text',
  yaml: 'text',
  yml: 'text',
  xml: 'text',
  html: 'text',
  htm: 'text',
  log: 'text',
  vtt: 'text',
  srt: 'text',
  tex: 'text',
  ipynb: 'text',
  eml: 'text',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  ods: 'spreadsheet',
  numbers: 'spreadsheet',
  ppt: 'presentation',
  pptx: 'presentation',
  odp: 'presentation',
  key: 'presentation',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  mp3: 'audio',
  wav: 'audio',
  mp4: 'video',
  zip: 'archive',
};

export { FILE_TYPE_FAMILIES, resolveFileName };
