import { getAccessToken, googleSlidesAuth } from '../auth';
import { createAction, Property } from "@activepieces/pieces-framework";
import { getSlide } from "../commons/common";

export const getPresentation = createAction({
    name: 'get_presentation',
    classification: 'READ',
    displayName: 'Get Presentation',
    description: 'Get all slides from a presentation',
    audience: 'both',
    aiMetadata: { description: 'Fetch a Google Slides presentation by its presentation ID, returning its title and the full set of slides and their page elements. Use this to read or inspect a presentation\'s contents before acting on it. Read-only and idempotent. Requires the presentation ID (the string between /d/ and /edit in the URL).', idempotent: true },
    auth: googleSlidesAuth,
    props: {
        presentation_id: Property.ShortText({
            displayName: 'Presentation ID',
            description: 'The ID of the presentation',
            required: true,
        })
    },
    async run(context) {
        const { presentation_id } = context.propsValue;
        const accessToken = await getAccessToken(context.auth);
        return await getSlide(accessToken, presentation_id);
    },
});