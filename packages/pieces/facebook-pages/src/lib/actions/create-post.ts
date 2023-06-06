import { createAction } from "@activepieces/pieces-framework"

import { facebookPagesCommon, FacebookPageDropdown } from "../common"

export const createPost = createAction({
    name: 'create_post',
    displayName: 'Create Page Post',
    description: 'Create a post on a Facebook Page you manage',
    props: {
        authentication: facebookPagesCommon.authentication,
        page: facebookPagesCommon.page,
        message: facebookPagesCommon.message,
        link: facebookPagesCommon.link
    },
    sampleData: {},

    async run(context) {
        const page = context.propsValue.page as FacebookPageDropdown
        
        const result = await facebookPagesCommon.createPost(page, context.propsValue.message, context.propsValue.link)

        return result;
    }
});