import * as z from 'zod/mini'

export const createCampaign = {
    campaignname: z.string(),
    from_email: z.string().check(z.email()),
    subject: z.string(),
    content_url: z.optional(z.string().check(z.url())),
    list_details: z.array(z.string()),
    topicId: z.optional(z.nullable(z.string())),
}

export const cloneCampaign = {
    campaignkey: z.string(),
    campaignname: z.optional(z.string()),
    subject: z.optional(z.string()),
    from_name: z.optional(z.string()),
    from_add: z.optional(z.string().check(z.email())),
    reply_to: z.optional(z.string().check(z.email())),
    encode_type: z.optional(z.string()),
}

export const sendCampaign = {
    campaignkey: z.string(),
}

export const addUpdateContact = {
    listkey: z.string(),
    contactinfo: z.object({
        'Contact Email': z.string().check(z.email()),
    }),
    source: z.optional(z.string()),
    topic_id: z.optional(z.nullable(z.string())),
}

export const addTagToContact = {
    tagName: z.string(),
    lead_email: z.string().check(z.email()),
}

export const removeTag = {
    tagName: z.string(),
    lead_email: z.string().check(z.email()),
}

export const unsubscribeContact = {
    listkey: z.string(),
    contactinfo: z.object({
        'Contact Email': z.string().check(z.email()),
    }),
    topic_id: z.optional(z.nullable(z.string())),
}

export const addContactToMailingList = {
    listkey: z.string(),
    emails: z.array(z.string().check(z.email())).check(z.minLength(1), z.maxLength(10)),
}

export const findContact = {
    listkey: z.string(),
    contactEmail: z.string().check(z.email()),
    status: z.optional(z.enum(['active', 'recent', 'most recent', 'unsub', 'bounce'])),
    sort: z.optional(z.enum(['asc', 'desc'])),
    fromindex: z.optional(z.number().check(z.minimum(1))),
    range: z.optional(z.number().check(z.minimum(1))),
}

export const findCampaign = {
    campaignName: z.string(),
    status: z.optional(z.enum(['all', 'all campaigns', 'drafts', 'scheduled', 'inprogress', 'sent', 'stopped', 'canceled', 'tobereviewed', 'reviewed', 'paused', 'intesting'])),
    sort: z.optional(z.enum(['asc', 'desc'])),
    fromindex: z.optional(z.number().check(z.minimum(1))),
    range: z.optional(z.number().check(z.minimum(1))),
}
