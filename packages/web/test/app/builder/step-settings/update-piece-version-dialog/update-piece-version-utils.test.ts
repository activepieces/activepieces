/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { changeVersionUtils } from '@/app/builder/step-settings/update-piece-version-dialog/update-piece-version-utils';

const fillTemplate = {
  pieceName: '@activepieces/piece-google-docs',
  actionOrTriggerName: 'create_document_based_on_template',
};

describe('changeVersionUtils.withInputsSavedOnUpgrade', () => {
  it('keeps an upgraded Fill Template step writing into the template', () => {
    const input = changeVersionUtils.withInputsSavedOnUpgrade({
      ...fillTemplate,
      currentVersion: '0.6.5',
      targetVersion: '0.7.2',
      input: { template: 'doc-id', create_copy: true },
    });

    expect(input).toEqual({ template: 'doc-id', create_copy: false });
  });

  it('reads a saved version range', () => {
    const input = changeVersionUtils.withInputsSavedOnUpgrade({
      ...fillTemplate,
      currentVersion: '~0.6.5',
      targetVersion: '0.7.2',
      input: { create_copy: true },
    });

    expect(input).toEqual({ create_copy: false });
  });

  it('leaves a step that already had the option alone', () => {
    const input = changeVersionUtils.withInputsSavedOnUpgrade({
      ...fillTemplate,
      currentVersion: '0.7.0',
      targetVersion: '0.7.2',
      input: { create_copy: true },
    });

    expect(input).toEqual({ create_copy: true });
  });

  it('leaves other actions and pieces alone', () => {
    const otherAction = changeVersionUtils.withInputsSavedOnUpgrade({
      pieceName: '@activepieces/piece-google-docs',
      actionOrTriggerName: 'copy_document',
      currentVersion: '0.6.5',
      targetVersion: '0.7.2',
      input: { title: 'x' },
    });
    const otherPiece = changeVersionUtils.withInputsSavedOnUpgrade({
      pieceName: '@activepieces/piece-slack',
      actionOrTriggerName: 'create_document_based_on_template',
      currentVersion: '0.6.5',
      targetVersion: '0.7.2',
      input: { title: 'x' },
    });

    expect(otherAction).toEqual({ title: 'x' });
    expect(otherPiece).toEqual({ title: 'x' });
  });
});
