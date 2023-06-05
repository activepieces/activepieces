import { Property, createAction } from "@activepieces/pieces-framework";
import { pastefyCommon } from "../common";

export default createAction({
    name: 'create_paste',
    displayName: 'Create Paste',
    description: 'Creates a new paste',
    props: {
        authentication: pastefyCommon.authentication(),
        title: Property.ShortText({
            displayName: 'Title',
            required: true
        }),
        content: Property.LongText({
            displayName: 'Content',
            required: true
        })
    },
    async run(context) {

    }
})