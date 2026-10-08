import { OutputSchema } from '@activepieces/pieces-framework';

import { role2Fields, roleFields, userRole2Fields, userRoleFields } from '../../../output-schemas';

export const mauticCheckUserPermissionsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'lead:leads:viewown', label: 'Lead Leads Viewown', format: 'boolean' },
		{ key: 'email:emails:create', label: 'Email Emails Create', format: 'boolean' },
	],
};

export const mauticCreateRoleOutputSchema: OutputSchema = {
	fields: [{ key: 'role', label: 'Role', children: role2Fields }],
};

export const mauticCreateUserOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'user',
			label: 'User',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'username', label: 'Username' },
				{ key: 'firstName', label: 'First Name' },
				{ key: 'lastName', label: 'Last Name' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'position', label: 'Position' },
				{ key: 'role', label: 'Role', children: userRoleFields },
				{ key: 'timezone', label: 'Timezone' },
				{ key: 'locale', label: 'Locale' },
				{ key: 'lastLogin', label: 'Last Login' },
				{ key: 'lastActive', label: 'Last Active' },
				{ key: 'signature', label: 'Signature' },
			],
		},
	],
};

export const mauticDeleteRoleOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'role',
			label: 'Role',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'isAdmin', label: 'Is Admin', format: 'boolean' },
				{
					key: 'rawPermissions',
					label: 'Raw Permissions',
					children: [
						{ key: 'lead:leads', label: 'Lead Leads' },
						{ key: 'email:emails', label: 'Email Emails' },
					],
				},
			],
		},
	],
};

export const mauticDeleteUserOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'user',
			label: 'User',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'username', label: 'Username' },
				{ key: 'firstName', label: 'First Name' },
				{ key: 'lastName', label: 'Last Name' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'position', label: 'Position' },
				{ key: 'role', label: 'Role', children: userRoleFields },
				{ key: 'timezone', label: 'Timezone' },
				{ key: 'locale', label: 'Locale' },
				{ key: 'lastLogin', label: 'Last Login' },
				{ key: 'lastActive', label: 'Last Active' },
				{ key: 'signature', label: 'Signature' },
			],
		},
	],
};

export const mauticGetCurrentUserOutputSchema: OutputSchema = {
	fields: [
		{ key: 'isPublished', label: 'Published', format: 'boolean' },
		{ key: 'id', label: 'ID', format: 'number' },
		{ key: 'username', label: 'Username' },
		{ key: 'firstName', label: 'First Name' },
		{ key: 'lastName', label: 'Last Name' },
		{ key: 'email', label: 'Email', format: 'email' },
		{ key: 'role', label: 'Role', children: roleFields },
		{ key: 'timezone', label: 'Timezone' },
		{ key: 'locale', label: 'Locale' },
		{ key: 'lastLogin', label: 'Last Login', format: 'datetime' },
		{ key: 'lastActive', label: 'Last Active', format: 'datetime' },
	],
};

export const mauticGetRoleOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'role',
			label: 'Role',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'isAdmin', label: 'Is Admin', format: 'boolean' },
				{
					key: 'rawPermissions',
					label: 'Raw Permissions',
					children: [
						{ key: 'lead:leads', label: 'Lead Leads' },
						{ key: 'email:emails', label: 'Email Emails' },
					],
				},
			],
		},
	],
};

export const mauticGetUserOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'user',
			label: 'User',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'username', label: 'Username' },
				{ key: 'firstName', label: 'First Name' },
				{ key: 'lastName', label: 'Last Name' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'position', label: 'Position' },
				{ key: 'role', label: 'Role', children: userRole2Fields },
				{ key: 'timezone', label: 'Timezone' },
				{ key: 'locale', label: 'Locale' },
				{ key: 'lastLogin', label: 'Last Login' },
				{ key: 'lastActive', label: 'Last Active' },
				{ key: 'signature', label: 'Signature' },
			],
		},
	],
};

export const mauticListAssignableRolesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'roles',
			label: 'Roles',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
			],
		},
	],
};

export const mauticListRolesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'roles', label: 'Roles', labelKey: 'name', listItems: role2Fields },
	],
};

export const mauticListUsersOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'users',
			label: 'Users',
			labelKey: 'email',
			listItems: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'username', label: 'Username' },
				{ key: 'firstName', label: 'First Name' },
				{ key: 'lastName', label: 'Last Name' },
				{ key: 'email', label: 'Email', format: 'email' },
				{ key: 'position', label: 'Position' },
				{ key: 'role', label: 'Role', children: userRole2Fields },
				{ key: 'timezone', label: 'Timezone' },
				{ key: 'locale', label: 'Locale' },
				{ key: 'lastLogin', label: 'Last Login' },
				{ key: 'lastActive', label: 'Last Active' },
				{ key: 'signature', label: 'Signature' },
			],
		},
	],
};

export const mauticUpdateRoleOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'role',
			label: 'Role',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'isAdmin', label: 'Is Admin', format: 'boolean' },
				{
					key: 'rawPermissions',
					label: 'Raw Permissions',
					children: [{ key: 'lead:leads', label: 'Lead Leads' }],
				},
			],
		},
	],
};
