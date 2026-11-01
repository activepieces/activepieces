import { OutputSchema } from '@activepieces/pieces-framework';

import {
	categoryFields,
	formActionsFields,
	formFieldsFields,
	submissionFormFields,
	submissionLeadFields,
} from '../../../output-schemas';

export const mauticCreateFormOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'form',
			label: 'Form',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'cachedHtml', label: 'Cached HTML' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'fields', label: 'Fields', labelKey: 'label', listItems: formFieldsFields },
				{ key: 'actions', label: 'Actions', labelKey: 'name', listItems: formActionsFields },
				{ key: 'template', label: 'Template' },
				{ key: 'inKioskMode', label: 'In Kiosk Mode', format: 'boolean' },
				{ key: 'renderStyle', label: 'Render Style', format: 'boolean' },
				{ key: 'formType', label: 'Form Type' },
				{ key: 'postAction', label: 'Post Action' },
				{ key: 'postActionProperty', label: 'Post Action Property', format: 'url' },
				{ key: 'noIndex', label: 'No Index' },
				{ key: 'formAttributes', label: 'Form Attributes' },
				{ key: 'language', label: 'Language' },
			],
		},
	],
};

export const mauticDeleteFormActionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'form',
			label: 'Form',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'alias', label: 'Alias' },
				{
					key: 'category',
					label: 'Category',
					children: [
						{ key: 'isPublished', label: 'Published', format: 'boolean' },
						{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'title', label: 'Title' },
						{ key: 'alias', label: 'Alias' },
						{ key: 'description', label: 'Description' },
						{ key: 'color', label: 'Color' },
						{ key: 'bundle', label: 'Bundle' },
					],
				},
				{ key: 'description', label: 'Description' },
				{ key: 'cachedHtml', label: 'Cached HTML' },
				{
					key: 'fields',
					label: 'Fields',
					labelKey: 'label',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'label', label: 'Label' },
						{ key: 'showLabel', label: 'Show Label', format: 'boolean' },
						{ key: 'alias', label: 'Alias' },
						{ key: 'type', label: 'Type' },
						{ key: 'isRequired', label: 'Is Required', format: 'boolean' },
						{ key: 'order', label: 'Order', format: 'number' },
						{ key: 'properties', label: 'Properties' },
						{ key: 'validation', label: 'Validation' },
						{ key: 'conditions', label: 'Conditions' },
						{ key: 'leadField', label: 'Lead Field' },
						{ key: 'saveResult', label: 'Save Result', format: 'boolean' },
						{ key: 'isAutoFill', label: 'Is Auto Fill', format: 'boolean' },
						{ key: 'mappedObject', label: 'Mapped Object' },
						{ key: 'mappedField', label: 'Mapped Field' },
					],
				},
				{
					key: 'actions',
					label: 'Actions',
					labelKey: 'name',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'name', label: 'Name' },
						{ key: 'type', label: 'Type' },
						{ key: 'order', label: 'Order', format: 'number' },
						{
							key: 'properties',
							label: 'Properties',
							children: [
								{ key: 'operator', label: 'Operator' },
								{ key: 'points', label: 'Points', format: 'number' },
							],
						},
					],
				},
				{ key: 'inKioskMode', label: 'In Kiosk Mode', format: 'boolean' },
				{ key: 'renderStyle', label: 'Render Style', format: 'boolean' },
				{ key: 'formType', label: 'Form Type' },
				{ key: 'postAction', label: 'Post Action' },
				{ key: 'postActionProperty', label: 'Post Action Property', format: 'url' },
			],
		},
	],
};

export const mauticDeleteFormOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'form',
			label: 'Form',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'cachedHtml', label: 'Cached HTML' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{
					key: 'fields',
					label: 'Fields',
					labelKey: 'label',
					listItems: [
						{ key: 'id', label: 'ID' },
						{ key: 'label', label: 'Label' },
						{ key: 'showLabel', label: 'Show Label', format: 'boolean' },
						{ key: 'alias', label: 'Alias' },
						{ key: 'type', label: 'Type' },
						{ key: 'defaultValue', label: 'Default Value' },
						{ key: 'isRequired', label: 'Is Required', format: 'boolean' },
						{ key: 'validationMessage', label: 'Validation Message' },
						{ key: 'helpMessage', label: 'Help Message' },
						{ key: 'order', label: 'Order', format: 'number' },
						{ key: 'properties', label: 'Properties' },
						{ key: 'validation', label: 'Validation' },
						{ key: 'parent', label: 'Parent' },
						{ key: 'conditions', label: 'Conditions' },
						{ key: 'labelAttributes', label: 'Label Attributes' },
						{ key: 'inputAttributes', label: 'Input Attributes' },
						{ key: 'containerAttributes', label: 'Container Attributes' },
						{ key: 'leadField', label: 'Lead Field' },
						{ key: 'saveResult', label: 'Save Result', format: 'boolean' },
						{ key: 'isAutoFill', label: 'Is Auto Fill', format: 'boolean' },
						{ key: 'mappedObject', label: 'Mapped Object' },
						{ key: 'mappedField', label: 'Mapped Field' },
					],
				},
				{
					key: 'actions',
					label: 'Actions',
					labelKey: 'name',
					listItems: [
						{ key: 'id', label: 'ID' },
						{ key: 'name', label: 'Name' },
						{ key: 'description', label: 'Description' },
						{ key: 'type', label: 'Type' },
						{ key: 'order', label: 'Order', format: 'number' },
						{
							key: 'properties',
							label: 'Properties',
							children: [
								{ key: 'operator', label: 'Operator' },
								{ key: 'points', label: 'Points', format: 'number' },
								{ key: 'group', label: 'Group' },
							],
						},
					],
				},
				{ key: 'template', label: 'Template' },
				{ key: 'inKioskMode', label: 'In Kiosk Mode', format: 'boolean' },
				{ key: 'renderStyle', label: 'Render Style', format: 'boolean' },
				{ key: 'formType', label: 'Form Type' },
				{ key: 'postAction', label: 'Post Action' },
				{ key: 'postActionProperty', label: 'Post Action Property', format: 'url' },
				{ key: 'noIndex', label: 'No Index' },
				{ key: 'formAttributes', label: 'Form Attributes' },
				{ key: 'language', label: 'Language' },
			],
		},
	],
};

export const mauticGetFormSubmissionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'submission',
			label: 'Submission',
			children: [
				{ key: 'id', label: 'ID', format: 'number' },
				{
					key: 'ipAddress',
					label: 'IP Address',
					children: [{ key: 'ipAddress', label: 'IP Address' }],
				},
				{ key: 'form', label: 'Form', children: submissionFormFields },
				{ key: 'lead', label: 'Lead', children: submissionLeadFields },
				{ key: 'trackingId', label: 'Tracking ID' },
				{ key: 'dateSubmitted', label: 'Date Submitted', format: 'datetime' },
				{ key: 'referer', label: 'Referer' },
				{ key: 'page', label: 'Page' },
				{
					key: 'results',
					label: 'Results',
					children: [
						{ key: 'form_id', label: 'Form ID' },
						{ key: 'email', label: 'Email', format: 'email' },
					],
				},
			],
		},
	],
};

export const mauticListContactFormSubmissionsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total' },
		{
			key: 'submissions',
			label: 'Submissions',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{
					key: 'ipAddress',
					label: 'IP Address',
					children: [{ key: 'ipAddress', label: 'IP Address' }],
				},
				{ key: 'form', label: 'Form', children: submissionFormFields },
				{ key: 'lead', label: 'Lead', children: submissionLeadFields },
				{ key: 'trackingId', label: 'Tracking ID' },
				{ key: 'dateSubmitted', label: 'Date Submitted', format: 'datetime' },
				{ key: 'referer', label: 'Referer' },
				{ key: 'page', label: 'Page' },
				{
					key: 'results',
					label: 'Results',
					children: [{ key: 'email', label: 'Email', format: 'email' }],
				},
			],
		},
	],
};

export const mauticListFormsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'forms',
			label: 'Forms',
			labelKey: 'name',
			listItems: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'cachedHtml', label: 'Cached HTML' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'fields', label: 'Fields', labelKey: 'label', listItems: formFieldsFields },
				{ key: 'actions', label: 'Actions', labelKey: 'name', listItems: formActionsFields },
				{ key: 'template', label: 'Template' },
				{ key: 'inKioskMode', label: 'In Kiosk Mode', format: 'boolean' },
				{ key: 'renderStyle', label: 'Render Style', format: 'boolean' },
				{ key: 'formType', label: 'Form Type' },
				{ key: 'postAction', label: 'Post Action' },
				{ key: 'postActionProperty', label: 'Post Action Property' },
				{ key: 'noIndex', label: 'No Index' },
				{ key: 'formAttributes', label: 'Form Attributes' },
				{ key: 'language', label: 'Language' },
			],
		},
	],
};
