import { clockodoCommon, makeClient } from "../../common";
import { clockodo } from "../../../";

clockodo.addAction({
    name: 'delete_service',
    displayName: 'Delete Service',
    description: 'Deletes a service in clockodo',
    props: {
        service_id: clockodoCommon.service_id(true, false)
    },
    async run({ auth, propsValue }) {
        const client = makeClient(auth);
        await client.deleteService(propsValue.service_id as number)
    }
})
