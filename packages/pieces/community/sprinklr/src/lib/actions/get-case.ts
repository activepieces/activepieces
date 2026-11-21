import { createAction, Property } from '@activepieces/pieces-framework';
import { sprinklrAuth } from '../auth';
import { sprinklrCase } from '../common/case';

export const getCaseAction = createAction({
  auth: sprinklrAuth,
  name: 'get_case',
  classification: 'READ',
  displayName: 'Get Case',
  description: 'Gets one case by its case number or ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one Sprinklr case when you already know its case number (the number agents see) or its internal case ID. Use Search Cases to find cases by keyword, date or queue instead. Fails with a clear error when no case matches; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    find_by: Property.StaticDropdown<'case_number' | 'case_id', true>({
      displayName: 'Find By',
      required: true,
      defaultValue: 'case_number',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          { label: 'Case Number', value: 'case_number', description: 'Shown as #1234', icon: 'tag' },
          { label: 'Case ID', value: 'case_id', description: 'Internal API ID', icon: 'code' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Case Number or ID',
      description: 'The case number, or the case ID if you chose Case ID.',
      placeholder: '1234',
      required: true,
    }),
  },
  async run(context) {
    const { find_by, value } = context.propsValue;
    const trimmed = String(value ?? '').trim().replace(/^#/, '');
    if (trimmed.length === 0) {
      throw new Error('Enter a case number or case ID.');
    }
    if (find_by === 'case_id') {
      return sprinklrCase.getById({ auth: context.auth, id: trimmed });
    }
    if (!/^\d+$/.test(trimmed)) {
      throw new Error(`"${trimmed}" is not a case number. Enter digits only, or choose Case ID to look up by ID.`);
    }
    return sprinklrCase.getByNumber({ auth: context.auth, caseNumber: trimmed });
  },
  outputSchema: sprinklrCase.outputSchema,
});
