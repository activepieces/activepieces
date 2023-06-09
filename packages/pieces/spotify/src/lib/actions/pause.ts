import { createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'pause',
    displayName: 'Pause',
    description: 'Pauses the playback',
    props: {
        authentication: spotifyCommon.authentication,
        device_id: spotifyCommon.device_id(false)
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        const res = await client.pause({
            device_id: context.propsValue.device_id
        })
        return res
    }
})