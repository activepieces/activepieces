import z from 'zod';

export const addUpdateContact = {
    list_id: z.string(),
    email_address: z.string().email(),
    fields: z.record(z.any()).optional(),
    tags: z.array(z.object({
        tag: z.string(),
    })).optional(),
    status: z.enum(['subscribed', 'unsubscribed', 'pending']).optional(),
};

export const findContact = {
    list_id: z.string(),
    email_address: z.string().email().optional(),
    tag: z.string().optional(),
    status: z.enum(['subscribed', 'unsubscribed', 'pending']).optional(),
    limit: z.number().optional(),
    starting_after: z.string().optional(),
    created_at_lte: z.string().optional(),
    created_at_gte: z.string().optional(),
    last_updated_at_lte: z.string().optional(),
    last_updated_at_gte: z.string().optional(),
};

export const unsubscribeContact = {
    list_id: z.string(),
    contact_id: z.string(),
};

export const updateContactEmail = {
    list_id: z.string(),
    contact_id: z.string(),
    email_address: z.string().email(),
};

export const addTagToContact = {
    list_id: z.string(),
    contact_id: z.string(),
    tag: z.string(),
};

export const removeTagFromContact = {
    list_id: z.string(),
    contact_id: z.string(),
    tag: z.string(),
};

export const createList = {
    name: z.string(),
};
