import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const contactPropertyFields: OutputSchema['fields'] = [
	{ key: 'Datatype', label: 'Data Type' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'Name', label: 'Name' },
	{ key: 'NameSpace', label: 'Namespace' },
];

export const mailjetContactPropertyOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Properties',
	labelKey: 'Name',
	fields: contactPropertyFields,
});
