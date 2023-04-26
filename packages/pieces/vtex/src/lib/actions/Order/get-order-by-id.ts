import { createAction, Property } from "@activepieces/pieces-framework";
import { Order } from "../../common/Order";
import { auth } from "../../common/auth";

export const getOrderById = createAction({
    name: "get-order-by-id",
    displayName: "Get Order By ID",
    description: "Find a Order by Id",
    props: {
        authentication: auth,
        OrderId: Property.Number({
            displayName: "Order ID",
            description: "The Order ID",
            required: true,
        })
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        const { OrderId } = context.propsValue;

        const order = new Order(hostUrl, appKey, appToken);

        return await order.getOrderById(OrderId);

    },
});