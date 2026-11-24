function ref({ value }: { value: string | undefined }): { value: string } | undefined {
	return value === undefined || value === '' ? undefined : { value };
}

function linesArray({ lines, propName }: { lines: unknown; propName: string }): unknown[] | undefined {
	if (lines === undefined || lines === null) {
		return undefined;
	}
	if (!Array.isArray(lines)) {
		throw new Error(`${propName} must be a JSON array of QuickBooks line objects.`);
	}
	return lines;
}

function compact({ fields }: { fields: Record<string, unknown> }): Record<string, unknown> {
	return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}

function requireChanges({ fields }: { fields: Record<string, unknown> }): Record<string, unknown> {
	if (Object.keys(fields).length === 0) {
		throw new Error('Set at least one field to change.');
	}
	return fields;
}

function flagValue({ value, propName }: { value: string | null | undefined; propName: string }): boolean | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	if (value !== 'true' && value !== 'false') {
		throw new Error(`${propName} must be 'true' or 'false'.`);
	}
	return value === 'true';
}

function attachableRef({
	entityType,
	entityId,
}: {
	entityType: string | undefined;
	entityId: string | undefined;
}): { EntityRef: { type: string; value: string } }[] | undefined {
	if (!entityType && !entityId) {
		return undefined;
	}
	if (!entityType || !entityId) {
		throw new Error('Set both Linked Entity Type and Linked Entity ID, or neither.');
	}
	return [{ EntityRef: { type: entityType, value: entityId } }];
}

export const quickbooksUtils = { ref, linesArray, compact, requireChanges, flagValue, attachableRef };
