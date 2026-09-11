import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hkVoiceAuth } from '../auth';
import { hkVoiceApi } from '../common/client';
import { toStringRecord } from '../common/props';

type VoiceConnection = {
    baseUrl: string;
    apiKey: string;
};

function readContactId(body: unknown): string | undefined {
    const flattened = hkVoiceApi.flattenBody(body);
    const id = flattened['id'] ?? flattened['contact_id'];
    return typeof id === 'string' ? id : undefined;
}

/** Search contacts by phone (or free-text q). Returns first match when present. */
export async function searchContactByPhone({
    connection,
    phone,
}: {
    connection: VoiceConnection;
    phone: string;
}): Promise<Record<string, unknown> | undefined> {
    const body = await hkVoiceApi.request({
        ...connection,
        method: HttpMethod.GET,
        path: hkVoiceApi.paths.contactSearch,
        query: { q: phone },
    });
    const items = hkVoiceApi.extractList({
        body,
        collectionKeys: ['results', 'contacts'],
    });
    if (items.length === 0) {
        return undefined;
    }
    const exact = items.find((item) => {
        const candidate =
            item['phone'] ?? item['phone_number'] ?? item['e164'] ?? item['number'];
        return typeof candidate === 'string' && candidate === phone;
    });
    return exact ?? items[0];
}

/**
 * Create contact, or return existing when Voice refuses a duplicate phone.
 * Optionally patches name / custom_fields when the contact already exists.
 */
export async function upsertContact({
    connection,
    phone,
    name,
    email,
    customFields,
}: {
    connection: VoiceConnection;
    phone: string;
    name?: string;
    email?: string;
    customFields?: Record<string, string>;
}): Promise<{ contact: Record<string, unknown>; created: boolean }> {
    try {
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.POST,
            path: hkVoiceApi.paths.contacts,
            body: {
                phone,
                ...(name ? { name } : {}),
                ...(email ? { email } : {}),
                ...(customFields ? { custom_fields: customFields } : {}),
            },
        });
        return { contact: hkVoiceApi.flattenBody(body), created: true };
    } catch (error) {
        const existing = await searchContactByPhone({ connection, phone });
        if (!existing) {
            if (error instanceof HttpError) {
                throw new Error(
                    `Could not create Voice contact for ${phone}: ${error.message}`
                );
            }
            throw error;
        }
        const contactId =
            typeof existing['id'] === 'string' ? existing['id'] : undefined;
        if (!contactId || (!name && !email && !customFields)) {
            return { contact: existing, created: false };
        }
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.PATCH,
            path: hkVoiceApi.paths.contactById(contactId),
            body: {
                ...(name ? { name } : {}),
                ...(email ? { email } : {}),
                ...(customFields ? { custom_fields: customFields } : {}),
            },
        });
        return { contact: hkVoiceApi.flattenBody(body), created: false };
    }
}

export const createContactAction = createAction({
    auth: hkVoiceAuth,
    name: 'create_contact',
    classification: 'WRITE',
    displayName: 'Create / Upsert Contact',
    description:
        'Creates a Voice contact (phone required). If the number already exists, updates name/email/custom fields and returns that contact.',
    audience: 'both',
    aiMetadata: {
        description:
            'Upserts a Heykoala Voice contact by E.164 phone. Use before Dispatch Outbound Call when the destination may not exist yet.',
        idempotent: true,
    },
    props: {
        phone: Property.ShortText({
            displayName: 'Phone (E.164)',
            description: 'e.g. +919876543210. Must be unique per organization.',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: 'Display name — also useful as a prompt variable later.',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            required: false,
        }),
        custom_fields: Property.Object({
            displayName: 'Custom fields',
            description:
                'Key/value map stored on the contact (e.g. reservation_id, lead_id). Echoed on webhooks as call.contact.custom_fields.',
            required: false,
        }),
    },
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const phone = context.propsValue.phone.trim();
        const result = await upsertContact({
            connection,
            phone,
            name: context.propsValue.name?.trim() || undefined,
            email: context.propsValue.email?.trim() || undefined,
            customFields: toStringRecord(context.propsValue.custom_fields),
        });
        return {
            ...result.contact,
            created: result.created,
            contact_id: readContactId(result.contact) ?? result.contact['id'],
        };
    },
});

export const searchContactAction = createAction({
    auth: hkVoiceAuth,
    name: 'search_contact',
    classification: 'READ',
    displayName: 'Search Contact',
    description: 'Searches Voice contacts by phone or free-text query.',
    audience: 'both',
    aiMetadata: {
        description:
            'Searches Heykoala Voice contacts via GET /contacts/search/?q=. Prefer an E.164 phone when looking up before dispatch.',
        idempotent: true,
    },
    props: {
        query: Property.ShortText({
            displayName: 'Query',
            description: 'Phone (E.164) or name fragment.',
            required: true,
        }),
    },
    async run(context) {
        const connection = hkVoiceApi.connectionFromAuth(context.auth);
        const query = context.propsValue.query.trim();
        const body = await hkVoiceApi.request({
            ...connection,
            method: HttpMethod.GET,
            path: hkVoiceApi.paths.contactSearch,
            query: { q: query },
        });
        const contacts = hkVoiceApi.extractList({
            body,
            collectionKeys: ['results', 'contacts'],
        });
        return {
            contacts,
            first: contacts[0] ?? null,
            found: contacts.length > 0,
        };
    },
});
