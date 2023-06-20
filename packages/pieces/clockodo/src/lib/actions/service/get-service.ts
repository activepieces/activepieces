import { clockodoCommon, makeClient } from "../../common";
import { clockodo } from "../../../";

clockodo.addAction({
    name: 'get_service',
    displayName: 'Get Service',
    description: 'Retrieves a single service from clockodo',
    props: {
        service_id: clockodoCommon.service_id(true, null)
    },
    async run({ auth, propsValue }) {
        const client = makeClient(auth);
        const res = await client.getService(propsValue.service_id as number)
        return res.service
    }
})
