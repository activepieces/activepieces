import { OutputSchema } from '@activepieces/pieces-framework';

import { fieldsAll3Fields, fieldsAllFields } from '../../../output-schemas';

export const mauticAdjustContactPointsOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'number' }],
};

export const mauticBatchCreateCompaniesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'companies',
			label: 'Companies',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'score', label: 'Score', format: 'number' },
				{
					key: 'fields',
					label: 'Fields',
					children: [{ key: 'all', label: 'All', children: fieldsAllFields }],
				},
			],
		},
		{ key: 'statusCodes', label: 'Status Codes' },
	],
};

export const mauticBatchDeleteCompaniesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'companies',
			label: 'Companies',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'score', label: 'Score', format: 'number' },
				{
					key: 'fields',
					label: 'Fields',
					children: [
						{ key: 'other', label: 'Other' },
						{ key: 'all', label: 'All', children: fieldsAll3Fields },
					],
				},
			],
		},
	],
};

export const mauticBatchUpdateCompaniesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'companies',
			label: 'Companies',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'score', label: 'Score', format: 'number' },
				{
					key: 'fields',
					label: 'Fields',
					children: [
						{ key: 'other', label: 'Other' },
						{ key: 'all', label: 'All', children: fieldsAll3Fields },
					],
				},
			],
		},
		{ key: 'statusCodes', label: 'Status Codes' },
	],
};

export const mauticCreateCompanyOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'company',
			label: 'Company',
			children: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'score', label: 'Score', format: 'number' },
				{
					key: 'fields',
					label: 'Fields',
					children: [
						{
							key: 'all',
							label: 'All',
							children: [
								{ key: 'id', label: 'ID', format: 'number' },
								{ key: 'companyaddress1', label: 'Company Address 1' },
								{ key: 'companyaddress2', label: 'Company Address 2' },
								{ key: 'companyemail', label: 'Company Email', format: 'email' },
								{ key: 'companyphone', label: 'Company Phone' },
								{ key: 'companycity', label: 'Company City' },
								{ key: 'companystate', label: 'Company State' },
								{ key: 'companyzipcode', label: 'Company Zip Code' },
								{ key: 'companycountry', label: 'Company Country' },
								{ key: 'companyname', label: 'Company Name' },
								{ key: 'companywebsite', label: 'Company Website', format: 'url' },
								{ key: 'companynumber_of_employees', label: 'Company Number of Employees' },
								{ key: 'companyfax', label: 'Company Fax' },
								{ key: 'companyannual_revenue', label: 'Company Annual Revenue' },
								{ key: 'companyindustry', label: 'Company Industry' },
								{ key: 'companydescription', label: 'Company Description' },
							],
						},
					],
				},
			],
		},
	],
};

export const mauticDeleteCompanyOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'company',
			label: 'Company',
			children: [
				{ key: 'id', label: 'ID' },
				{ key: 'score', label: 'Score', format: 'number' },
				{
					key: 'fields',
					label: 'Fields',
					children: [
						{ key: 'other', label: 'Other' },
						{
							key: 'all',
							label: 'All',
							children: [
								{ key: 'id', label: 'ID' },
								{ key: 'companyaddress1', label: 'Company Address 1' },
								{ key: 'companyaddress2', label: 'Company Address 2' },
								{ key: 'companyemail', label: 'Company Email', format: 'email' },
								{ key: 'companyphone', label: 'Company Phone' },
								{ key: 'companycity', label: 'Company City' },
								{ key: 'companystate', label: 'Company State' },
								{ key: 'companyzipcode', label: 'Company Zip Code' },
								{ key: 'companycountry', label: 'Company Country' },
								{ key: 'companyname', label: 'Company Name' },
								{ key: 'companywebsite', label: 'Company Website', format: 'url' },
								{
									key: 'companynumber_of_employees',
									label: 'Company Number of Employees',
									format: 'number',
								},
								{ key: 'companyfax', label: 'Company Fax' },
								{ key: 'companyannual_revenue', label: 'Company Annual Revenue' },
								{ key: 'companyindustry', label: 'Company Industry' },
								{ key: 'companydescription', label: 'Company Description' },
							],
						},
					],
				},
			],
		},
	],
};

export const mauticGetCompanyOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'company',
			label: 'Company',
			children: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'score', label: 'Score', format: 'number' },
				{
					key: 'fields',
					label: 'Fields',
					children: [
						{ key: 'other', label: 'Other' },
						{
							key: 'all',
							label: 'All',
							children: [
								{ key: 'id', label: 'ID', format: 'number' },
								{ key: 'companyaddress1', label: 'Company Address 1' },
								{ key: 'companyaddress2', label: 'Company Address 2' },
								{ key: 'companyemail', label: 'Company Email', format: 'email' },
								{ key: 'companyphone', label: 'Company Phone' },
								{ key: 'companycity', label: 'Company City' },
								{ key: 'companystate', label: 'Company State' },
								{ key: 'companyzipcode', label: 'Company Zip Code' },
								{ key: 'companycountry', label: 'Company Country' },
								{ key: 'companyname', label: 'Company Name' },
								{ key: 'companywebsite', label: 'Company Website', format: 'url' },
								{
									key: 'companynumber_of_employees',
									label: 'Company Number of Employees',
									format: 'number',
								},
								{ key: 'companyfax', label: 'Company Fax' },
								{ key: 'companyannual_revenue', label: 'Company Annual Revenue' },
								{ key: 'companyindustry', label: 'Company Industry' },
								{ key: 'companydescription', label: 'Company Description' },
							],
						},
					],
				},
			],
		},
	],
};

export const mauticListCompaniesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total' },
		{
			key: 'companies',
			label: 'Companies',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'score', label: 'Score', format: 'number' },
				{
					key: 'fields',
					label: 'Fields',
					children: [
						{ key: 'other', label: 'Other' },
						{
							key: 'all',
							label: 'All',
							children: [
								{ key: 'id', label: 'ID', format: 'number' },
								{ key: 'companyemail', label: 'Company Email', format: 'email' },
								{ key: 'companyaddress1', label: 'Company Address 1' },
								{ key: 'companyaddress2', label: 'Company Address 2' },
								{ key: 'companyphone', label: 'Company Phone' },
								{ key: 'companycity', label: 'Company City' },
								{ key: 'companystate', label: 'Company State' },
								{ key: 'companyzipcode', label: 'Company Zip Code' },
								{ key: 'companycountry', label: 'Company Country' },
								{ key: 'companyname', label: 'Company Name' },
								{ key: 'companywebsite', label: 'Company Website', format: 'url' },
								{ key: 'companyindustry', label: 'Company Industry' },
								{ key: 'companydescription', label: 'Company Description' },
								{ key: 'companynumber_of_employees', label: 'Company Number of Employees' },
								{ key: 'companyfax', label: 'Company Fax' },
								{ key: 'companyannual_revenue', label: 'Company Annual Revenue' },
							],
						},
					],
				},
			],
		},
	],
};
