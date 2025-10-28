import { ActionContext, ArrayProperty, CheckboxProperty, createAction, PieceAuthProperty, Property, ShortTextProperty, StaticDropdownProperty } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import deepEqual from 'deep-equal';
import { common, getScopeAndKey, PieceStoreScope } from './common';

async function executeStorageAddToList(context: ActionContext<PieceAuthProperty, {
	key: ShortTextProperty<true>;
	value: ArrayProperty<true>;
	ignore_if_exists: CheckboxProperty<false>;
	store_scope: StaticDropdownProperty<PieceStoreScope, true>;
}>, isTestMode = false) {
	await propsValidation.validateZod(context.propsValue, {
		key: z.string().max(128),
	});
	const { key, scope } = getScopeAndKey({
		runId: context.run.id,
		key: context.propsValue['key'],
		scope: context.propsValue.store_scope,
		isTestMode,
	});
	const inputItems = context.propsValue.value ?? [];
	let parsedInputItems: unknown[] = [];
	try {
		parsedInputItems = typeof inputItems === 'string' ? JSON.parse(inputItems) : inputItems;
		if (!Array.isArray(parsedInputItems)) {
			throw new Error(`Provided value is not a list.`);
		}
	} catch (err) {
		throw new Error(`An unexpected error occurred: ${(err as Error).message}`);
	}
	// Get existing items from store
	let items = (await context.store.get(key, scope)) ?? [];
	try {
		if (typeof items === 'string') {
			items = JSON.parse(items);
		}
		if (!Array.isArray(items)) {
			throw new Error(`Key ${context.propsValue['key']} is not a list.`);
		}
	} catch (err) {
		throw new Error(`An unexpected error occurred: ${(err as Error).message}`);
	}
	if (context.propsValue['ignore_if_exists']) {
		for (const newItem of parsedInputItems) {
			const exists = items.some((existingItem) => deepEqual(existingItem, newItem));
			if (!exists) {
				items.push(newItem);
			}
		}
	} else {
		items.push(...parsedInputItems);
	}
	return context.store.put(key, items, scope);
}

export const storageAddtoList = createAction({
	name: 'add_to_list',
	displayName: 'Add To List',
	description: 'Add Items to a list.',
	errorHandlingOptions: {
		continueOnFailure: {
			hide: true,
		},
		retryOnFailure: {
			hide: true,
		},
	},
	props: {
		key: Property.ShortText({
			displayName: 'Key',
			required: true,
		}),
		value: Property.Array({
			displayName: 'Value',
			required: true,
		}),
		ignore_if_exists: Property.Checkbox({
			displayName: 'Ignore if value exists',
			required: false,
		}),
		store_scope: common.store_scope,
	},
	async run(context) {
		return await executeStorageAddToList(context, false);
	},
	async test(context) {
		return await executeStorageAddToList(context, true);
	},
});
