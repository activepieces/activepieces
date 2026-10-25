import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp, candidateIdProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

const TEXT_FIELDS = ['firstname', 'lastname', 'email', 'headline', 'summary', 'phone', 'address', 'cover_letter'] as const;
const CLEARABLE = ['headline', 'summary', 'phone', 'address', 'cover_letter'];

export const updateCandidate = createAction({
  auth: workableAuth,
  name: 'update_candidate',
  classification: 'WRITE',
  displayName: 'Update Candidate',
  description: "Updates a candidate's profile. Empty fields are left unchanged.",
  audience: 'both',
  aiMetadata: {
    description:
      'Update fields on an existing Workable candidate by candidate ID. Only the fields you give are changed; use Clear Fields to blank headline, summary, phone, address or cover letter. Skills replace the whole skill list when given. Use Add Candidate Tags for tags and Move Candidate for stages. Running it twice with the same values gives the same result.',
    idempotent: true,
  },
  outputSchema: workableSchemas.candidate,
  props: {
    account_subdomain: accountSubdomainProp,
    id: candidateIdProp,
    firstname: Property.ShortText({ displayName: 'First Name', required: false }),
    lastname: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    headline: Property.ShortText({ displayName: 'Headline', required: false }),
    summary: Property.LongText({ displayName: 'Summary', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    address: Property.ShortText({ displayName: 'Address', required: false }),
    cover_letter: Property.LongText({ displayName: 'Cover Letter', required: false }),
    skills: Property.Array({
      displayName: 'Skills',
      description: 'Replaces all current skills when given. Leave empty to keep them.',
      required: false,
    }),
    clear_fields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to blank out on the candidate.',
      required: false,
      options: {
        options: [
          { label: 'Headline', value: 'headline' },
          { label: 'Summary', value: 'summary' },
          { label: 'Phone', value: 'phone' },
          { label: 'Address', value: 'address' },
          { label: 'Cover Letter', value: 'cover_letter' },
        ],
      },
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const v = workableValues;
    const candidate: Record<string, unknown> = {};
    const values: Record<string, unknown> = p;
    for (const key of TEXT_FIELDS) {
      const value = v.optionalText(values[key]);
      if (value !== undefined) {
        candidate[key] = value;
      }
    }
    const clear = v.stringList({ value: p.clear_fields, label: 'Clear Fields' }) ?? [];
    for (const key of clear) {
      if (!CLEARABLE.includes(key)) {
        throw new Error(`Clear Fields does not support "${key}".`);
      }
      if (key in candidate) {
        throw new Error(`"${key}" is both set and cleared. Choose one.`);
      }
      candidate[key] = '';
    }
    const skills = v.stringList({ value: p.skills, label: 'Skills' });
    if (skills !== undefined && skills.length > 0) {
      candidate['skills'] = skills;
    }
    if (Object.keys(candidate).length === 0) {
      throw new Error('Nothing to update. Fill at least one field or pick a field to clear.');
    }
    const id = encodeId({ value: p.id, label: 'Candidate ID' });
    const client = workableOps.client({ auth: context.auth, subdomain: p.account_subdomain });
    const body = await client.request({ method: HttpMethod.PATCH, path: `/candidates/${id}`, body: { candidate } });
    return workableOps.unwrap({ body, key: 'candidate' });
  },
});
