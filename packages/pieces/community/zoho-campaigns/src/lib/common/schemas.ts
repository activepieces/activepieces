import z from 'zod';

export const createCampaign = {
    campaignname: z.string(),
    from_email: z.string().email(),
    subject: z.string(),
    content_url: z.string().url().optional(),
    list_details: z.object({}),
    topicId: z.string().optional(),
}

export const cloneCampaign = {
    campaignkey: z.string(),
}

export const sendCampaign = {
    campaignkey: z.string(),
}

export const addUpdateContact = {
    listkey: z.string(),
    contactinfo: z.object({}),
    source: z.string().optional(),
    topic_id: z.string().optional(),
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
    contactinfo: z.object({}),
    topic_id: z.string().optional(),
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
