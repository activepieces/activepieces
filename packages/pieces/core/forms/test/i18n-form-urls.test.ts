/// <reference types="vitest/globals" />

import fs from 'fs';
import path from 'path';
import { USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/pieces-framework';

const i18nDir = path.resolve(__dirname, '../src/i18n');
const sourceFile = 'translation.json';
const aboutKeyMarker = 'Draft Form URL';
const publishedUrlBlock = '```text\n{{formUrl}}\n```';
const draftUrlBlock = `\`\`\`text\n{{formUrl}}?${USE_DRAFT_QUERY_PARAM_NAME}=true\n\`\`\``;

function aboutMarkdown(file: string): string | undefined {
  const translations: Record<string, string> = JSON.parse(
    fs.readFileSync(path.join(i18nDir, file), 'utf8')
  );
  const key = Object.keys(translations).find((candidate) =>
    candidate.includes(aboutKeyMarker)
  );
  return key === undefined ? undefined : translations[key];
}

const localeFiles = fs
  .readdirSync(i18nDir)
  .filter((file) => file.endsWith('.json'));

describe('form trigger about markdown', () => {
  test('locale files are discovered', () => {
    expect(localeFiles).toContain(sourceFile);
    expect(localeFiles.length).toBeGreaterThan(1);
  });

  test.each(localeFiles)(
    '%s keeps both form URLs in copyable text blocks',
    (file) => {
      const markdown = aboutMarkdown(file);
      expect(markdown).toBeDefined();
      expect(markdown).toContain(publishedUrlBlock);
      expect(markdown).toContain(draftUrlBlock);
    }
  );
});
