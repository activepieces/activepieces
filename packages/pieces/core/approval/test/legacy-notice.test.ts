/// <reference types="vitest/globals" />

import fs from 'fs';
import path from 'path';
import { createApprovalLink } from '../src/lib/actions/create-approval-link';
import { waitForApprovalLink } from '../src/lib/actions/wait-for-approval';

const actions = [
  { name: 'wait_for_approval', action: waitForApprovalLink },
  { name: 'create_approval_links', action: createApprovalLink },
];

const sourceTranslations = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'src', 'i18n', 'translation.json'),
    'utf-8',
  ),
);

describe.each(actions)('$name legacy notice', ({ action }) => {
  test('does not point at the removed Manual Task feature', () => {
    expect(action.props.markdown.description).toEqual(expect.any(String));
    expect(action.props.markdown.description).not.toMatch(/manual task/i);
    expect(action.aiMetadata?.description).not.toMatch(/manual task/i);
  });

  test('points at the Approvals tab that replaced it', () => {
    expect(action.props.markdown.description).toMatch(/Approvals tab/);
  });

  test('is translatable from the source translation file', () => {
    expect(sourceTranslations).toHaveProperty(
      action.props.markdown.description as string,
    );
  });
});
