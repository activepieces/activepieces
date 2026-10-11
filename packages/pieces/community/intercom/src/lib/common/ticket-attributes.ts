import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { intercomRequest, IntercomAuthValue } from './client';

export async function getTicketTypeAttributes({
	auth,
	ticketTypeId,
}: {
	auth: IntercomAuthValue;
	ticketTypeId: string;
}): Promise<TicketTypeAttribute[]> {
	const body = await intercomRequest<{ ticket_type_attributes?: { data?: TicketTypeAttribute[] } }>({
		auth,
		method: HttpMethod.GET,
		path: ['ticket_types', ticketTypeId],
		operation: 'get the ticket type',
	});
	return body.ticket_type_attributes?.data ?? [];
}

export function toTicketAttributes({
	attributes,
	values,
}: {
	attributes: TicketTypeAttribute[];
	values: Record<string, unknown>;
}): Record<string, unknown> {
	const byName = new Map(attributes.map((attribute) => [attribute.name, attribute]));
	return Object.fromEntries(
		Object.entries(values)
			.filter(([, value]) => value !== undefined)
			.map(([name, value]) => [
				name,
				convertValue({ name, value, dataType: byName.get(name)?.data_type }),
			]),
	);
}

export function toWebhookTicketShape(ticket: unknown): unknown {
	if (typeof ticket !== 'object' || ticket === null) {
		return ticket;
	}
	const state: unknown = Reflect.get(ticket, 'ticket_state');
	if (typeof state !== 'string') {
		return ticket;
	}
	const flatLabelKeys = ['ticket_state_internal_label', 'ticket_state_external_label'];
	const rest = Object.fromEntries(Object.entries(ticket).filter(([key]) => !flatLabelKeys.includes(key)));
	return {
		...rest,
		ticket_state: {
			type: 'ticket_state',
			category: state,
			internal_label: Reflect.get(ticket, 'ticket_state_internal_label') ?? null,
			external_label: Reflect.get(ticket, 'ticket_state_external_label') ?? null,
		},
	};
}

function convertValue({
	name,
	value,
	dataType,
}: {
	name: string;
	value: unknown;
	dataType: string | undefined;
}): unknown {
	if (value === null) {
		return null;
	}
	switch (dataType) {
		case 'datetime':
			return toUnixSeconds({ name, value });
		case 'integer':
		case 'decimal':
			return toNumber({ name, value, integer: dataType === 'integer' });
		case 'boolean':
			return toBoolean({ name, value });
		default:
			return value;
	}
}

function toUnixSeconds({ name, value }: { name: string; value: unknown }): number {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value > MILLISECONDS_THRESHOLD ? Math.floor(value / 1000) : Math.floor(value);
	}
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (/^\d+$/.test(trimmed)) {
			const numeric = Number(trimmed);
			return numeric > MILLISECONDS_THRESHOLD ? Math.floor(numeric / 1000) : numeric;
		}
		const parsed = dayjs(trimmed);
		if (trimmed.length > 0 && parsed.isValid()) {
			return parsed.unix();
		}
	}
	throw new Error(`Ticket attribute "${name}" expects a date and time (ISO 8601 or Unix seconds); got ${JSON.stringify(value)}.`);
}

function toNumber({ name, value, integer }: { name: string; value: unknown; integer: boolean }): number {
	const numeric = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
	if (!Number.isFinite(numeric) || (integer && !Number.isInteger(numeric))) {
		throw new Error(`Ticket attribute "${name}" expects ${integer ? 'a whole number' : 'a number'}; got ${JSON.stringify(value)}.`);
	}
	return numeric;
}

function toBoolean({ name, value }: { name: string; value: unknown }): boolean {
	if (typeof value === 'boolean') {
		return value;
	}
	if (value === 'true' || value === 'false') {
		return value === 'true';
	}
	throw new Error(`Ticket attribute "${name}" expects true or false; got ${JSON.stringify(value)}.`);
}

const MILLISECONDS_THRESHOLD = 100_000_000_000;

export type TicketTypeAttribute = {
	id?: string;
	name: string;
	description?: string;
	data_type: string;
	required_to_create?: boolean;
	visible_to_contacts?: boolean;
	archived?: boolean;
	input_options?: Record<string, unknown> | null;
};
