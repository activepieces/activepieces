import { createAction } from "@activepieces/pieces-framework"

import { instagramCommon, FacebookPageDropdown } from "../common"

export const uploadPhoto = createAction({
    name: 'upload_photo',
    displayName: 'Upload Photo',
    description: 'Upload a photo to an Instagram Professional Account',
    props: {
        authentication: instagramCommon.authentication,
        page: instagramCommon.page,
        photo: instagramCommon.photo,
        caption: instagramCommon.caption
    },
    sampleData: {},

    async run(context) {
        const page: FacebookPageDropdown = context.propsValue.page!
    
        const result = await instagramCommon.createPhotoPost(page, context.propsValue.caption, context.propsValue.photo)
        return result;
    }
});