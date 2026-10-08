import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { describeObjectOutputSchema } from '../../output-schemas';

export const describeObject = createAction({
	auth: salesforceAuth,
	name: 'describe_object',
	classification: 'READ',
	displayName: 'Describe Object',
	description: 'Get the fields, relationships and record types of one object.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the schema of one Salesforce object: every field (API name, label, type, required-ness, create/update permission, external id flag, lookup targets, active picklist values), its child relationships and its record types. Call it before writing SOQL or creating/updating records to get exact field API names and valid picklist values; to find the object API name first use List Objects. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: describeObjectOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account, Opportunity or My_Object__c.',
			required: true,
		}),
	},
	async run(context) {
		const object = salesforceUtils.assertApiName({ value: context.propsValue.object, fieldName: 'Object' });
		const response = await callSalesforceApi<DescribeResult>(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/sobjects/${object}/describe`,
			undefined
		);
		const body = response.body;
		return {
			name: body.name,
			label: body.label,
			custom: body.custom,
			key_prefix: body.keyPrefix,
			fields: body.fields.map((field) => ({
				name: field.name,
				label: field.label,
				type: field.type,
				length: field.length,
				nillable: field.nillable,
				createable: field.createable,
				updateable: field.updateable,
				custom: field.custom,
				external_id: field.externalId,
				reference_to: field.referenceTo,
				picklist_values: field.picklistValues
					.filter((value) => value.active)
					.map((value) => ({ value: value.value, label: value.label })),
			})),
			child_relationships: body.childRelationships
				.filter((relationship) => relationship.relationshipName !== null)
				.map((relationship) => ({
					relationship_name: relationship.relationshipName,
					child_object: relationship.childSObject,
					field: relationship.field,
				})),
			record_types: body.recordTypeInfos.map((recordType) => ({
				name: recordType.name,
				developer_name: recordType.developerName,
				record_type_id: recordType.recordTypeId,
				active: recordType.active,
				master: recordType.master,
			})),
		};
	},
});

type DescribeResult = {
	name: string;
	label: string;
	custom: boolean;
	keyPrefix: string | null;
	fields: {
		name: string;
		label: string;
		type: string;
		length: number;
		nillable: boolean;
		createable: boolean;
		updateable: boolean;
		custom: boolean;
		externalId: boolean;
		referenceTo: string[];
		picklistValues: { value: string; label: string; active: boolean }[];
	}[];
	childRelationships: {
		relationshipName: string | null;
		childSObject: string;
		field: string;
	}[];
	recordTypeInfos: {
		name: string;
		developerName: string;
		recordTypeId: string;
		active: boolean;
		master: boolean;
	}[];
};
