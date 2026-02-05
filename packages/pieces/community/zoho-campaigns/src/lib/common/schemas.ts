import z from 'zod';

export const createCampaign = {
    campaignname: z.string(),
    from_email: z.string().email(),
    subject: z.string(),
    content_url: z.string().url().optional(),
    list_details: z.array(z.string()),
    topicId: z.string().nullable().optional(),
}

export const cloneCampaign = {
    campaignkey: z.string(),
    campaignname: z.string().optional(),
    subject: z.string().optional(),
    from_name: z.string().optional(),
    from_add: z.string().email().optional(),
    reply_to: z.string().email().optional(),
    encode_type: z.string().optional(),
}

export const sendCampaign = {
    campaignkey: z.string(),
}

export const addUpdateContact = {
    listkey: z.string(),
    contactinfo: z.object({
        'Contact Email': z.string().email(),
    }),
    source: z.string().optional(),
    topic_id: z.string().nullable().optional(),
}

export const addTagToContact = {
    tagName: z.string(),
    lead_email: z.string().email(),
}

export const removeTag = {
    tagName: z.string(),
    lead_email: z.string().email(),
}

export const unsubscribeContact = {
    listkey: z.string(),
    contactinfo: z.object({
        'Contact Email': z.string().email(),
    }),
    topic_id: z.string().nullable().optional(),
}

export const addContactToMailingList = {
    listkey: z.string(),
    emails: z.array(z.string().email()).min(1).max(10),
}

export const findContact = {
    listkey: z.string(),
    contactEmail: z.string().email(),
    status: z.enum(['active', 'recent', 'most recent', 'unsub', 'bounce']).optional(),
    sort: z.enum(['asc', 'desc']).optional(),
    fromindex: z.number().min(1).optional(),
    range: z.number().min(1).optional(),
}

export const findCampaign = {
    campaignName: z.string(),
    status: z.enum(['all', 'all campaigns', 'drafts', 'scheduled', 'inprogress', 'sent', 'stopped', 'canceled', 'tobereviewed', 'reviewed', 'paused', 'intesting']).optional(),
    sort: z.enum(['asc', 'desc']).optional(),
    fromindex: z.number().min(1).optional(),
    range: z.number().min(1).optional(),
}
