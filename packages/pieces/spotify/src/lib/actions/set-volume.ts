import { Property, createAction } from "@activepieces/pieces-framework";
import { spotifyCommon, makeClient } from "../common";

export default createAction({
    name: 'set_volume',
    displayName: 'Set Volume',
    description: 'Sets the volume of the player',
    props: {
        authentication: spotifyCommon.authentication,
        volume: Property.Number({
            displayName: 'Volume',
            description: 'Volume from 0 to 100',
            required: true
        }),
        device_id: spotifyCommon.device_id(false)
    },
    async run(context) {
        const client = makeClient(context.propsValue)
        const res = await client.setVolume({
            volume_percent: context.propsValue.volume,
            device_id: context.propsValue.device_id
        })
        return res
    }
})