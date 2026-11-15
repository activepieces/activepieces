import { describe, expect, it } from 'vitest';
import { createDocumentBasedOnTemplate } from './create-document-based-on-template.action';

describe('Fill Template AI description', () => {
  it('tells an agent that a missing create_copy writes into the template', () => {
    expect(createDocumentBasedOnTemplate.aiMetadata?.description).toContain(
      'when create_copy is false or missing, it writes into the template itself',
    );
    expect(createDocumentBasedOnTemplate.aiMetadata?.description).not.toContain('By default it copies the template');
  });
});
