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
    campaignname: z.string(),
    subject: z.string().optional(),
}

export const sendCampaign = {
    campaignkey: z.string(),
}

export const addUpdateContact = {
    listkey: z.string(),
    contactinfo: z.object({}),
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
    contactEmail: z.string().email(),
    topic_id: z.string().nullable().optional(),
}

export const addContactToMailingList = {
    listkey: z.string(),
    emails: z.array(z.string().email()),
}

export const findContact = {
    listkey: z.string(),
    contactEmail: z.string().email(),
}

export const findCampaign = {
    campaignName: z.string(),
}
