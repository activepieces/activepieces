import { FieldControlMode } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { predefinedInputsUtils } from '@/app/builder/step-settings/agent-settings/predefined-inputs-utils';

describe('predefinedInputsUtils.withEditedField', () => {
  it('saves an edit to a top-level input set by the user', () => {
    const fields = predefinedInputsUtils.withEditedField({
      fields: { title: { mode: FieldControlMode.CHOOSE_YOURSELF, value: '' } },
      changedPath: 'title',
      values: { title: 'Offer' },
    });

    expect(fields).toEqual({
      title: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'Offer' },
    });
  });

  it('saves an edit inside a dynamic group under the group input', () => {
    const fields = predefinedInputsUtils.withEditedField({
      fields: {
        fields: { mode: FieldControlMode.CHOOSE_YOURSELF, value: {} },
        title: { mode: FieldControlMode.AGENT_DECIDE },
      },
      changedPath: 'fields.customer',
      values: { fields: { customer: 'Acme', date: '2026-11-15' } },
    });

    expect(fields).toEqual({
      fields: {
        mode: FieldControlMode.CHOOSE_YOURSELF,
        value: { customer: 'Acme', date: '2026-11-15' },
      },
      title: { mode: FieldControlMode.AGENT_DECIDE },
    });
  });

  it('saves an edit inside an array row under the array input', () => {
    const fields = predefinedInputsUtils.withEditedField({
      fields: { images: { mode: FieldControlMode.CHOOSE_YOURSELF, value: [] } },
      changedPath: 'images.0.url',
      values: {
        images: [{ imageObjectId: 'logo', url: 'https://x.test/a.png' }],
      },
    });

    expect(fields.images.value).toEqual([
      { imageObjectId: 'logo', url: 'https://x.test/a.png' },
    ]);
  });

  it('leaves inputs the agent decides untouched', () => {
    const before = { fields: { mode: FieldControlMode.AGENT_DECIDE } };

    const fields = predefinedInputsUtils.withEditedField({
      fields: before,
      changedPath: 'fields.customer',
      values: { fields: { customer: 'Acme' } },
    });

    expect(fields).toBe(before);
  });
});
