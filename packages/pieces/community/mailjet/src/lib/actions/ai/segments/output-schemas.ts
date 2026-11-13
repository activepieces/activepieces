import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const segmentFields: OutputSchema['fields'] = [
	{ key: 'Description', label: 'Description' },
	{ key: 'Expression', label: 'Expression' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'Name', label: 'Name' },
	{ key: 'Status', label: 'Status' },
];

export const mailjetSegmentOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Segments',
	labelKey: 'Name',
	fields: segmentFields,
});
