import { describe, expect, it } from 'vitest';

import { googleDocumentAi } from '../src/index';
import { googleDocumentAiAuth, googleDocumentAiScopes } from '../src/lib/auth';

describe('googleDocumentAi piece', () => {
  it('should expose the display name the builder shows', () => {
    expect(googleDocumentAi.displayName).toBe('Google Document AI');
  });

  it('should register every action under a unique name', () => {
    const names = Object.keys(googleDocumentAi.actions());

    expect(names).toEqual(expect.arrayContaining(['processDocument', 'custom_api_call']));
    expect(new Set(names).size).toBe(names.length);
  });

  it('should offer a service account and an OAuth2 connection, OAuth asking for cloud-platform', () => {
    expect(googleDocumentAiAuth).toHaveLength(2);
    expect(googleDocumentAiScopes).toEqual(['https://www.googleapis.com/auth/cloud-platform', 'email']);
  });

  it('should point the logo at the Activepieces CDN', () => {
    expect(googleDocumentAi.logoUrl).toBe('https://cdn.activepieces.com/pieces/google-document-ai.png');
  });

  it('should tag Process Document for agents and the builder', () => {
    const action = googleDocumentAi.actions()['processDocument'];

    expect(action.classification).toBe('READ');
    expect(action.audience).toBe('both');
    expect(action.aiMetadata).toEqual({ description: expect.any(String), idempotent: true });
    expect(action.outputSchema?.fields.map((f) => f.key)).toEqual(expect.arrayContaining(['text', 'entities', 'formFields', 'tables']));
  });
});
