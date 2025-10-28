import { googleSlidesAuth } from '../../index';
import { createAction, Property } from "@activepieces/pieces-framework";
import { getSlide } from "../commons/common";

export const getPresentation = createAction({
    name: 'get_presentation',
    displayName: 'Get Presentation',
    description: 'Get all slides from a presentation',
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
        const { access_token } = context.auth;
        return await getSlide(access_token, presentation_id);
    },
});