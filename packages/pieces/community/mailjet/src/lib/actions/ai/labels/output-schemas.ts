import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const labelFields: OutputSchema['fields'] = [
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'OrganisationID', label: 'Organisation ID', format: 'number' },
	{ key: 'Name', label: 'Name' },
	{ key: 'Color', label: 'Color' },
	{ key: 'UsedFor', label: 'Used For' },
];

export const mailjetLabelOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Labels',
	labelKey: 'Name',
	fields: labelFields,
});
