import { Property, createAction } from "@activepieces/pieces-framework";
import { Order } from "../../common/Order";
import { auth } from "../../common/auth";

const year = new Date().getFullYear().toString();

export const getOrderList = createAction({
    name: "get-order-list",
    displayName: "Get Orders List",
    description: "Find Orders",
    props: {
        authentication: auth,
        fromYear: Property.Number({
            displayName: "From (Year)",
            required: true
        }),
        toYear: Property.ShortText({
            displayName: "To (Year)",
            defaultValue: year,
            required: true
        }),
        fromMonth: Property.Number({
            displayName: "From (Month)",
            defaultValue: 1,
            required: false
        }),
        toMonth: Property.Number({
            displayName: "To (Month)",
            defaultValue: 12,
            required: false
        }),
        fromDay: Property.Number({
            displayName: "From (Day)",
            defaultValue: 1,
            required: false
        }),
        toDay: Property.Number({
            displayName: "To (Day)",
            defaultValue: 28,
            required: false
        }),
    },
    async run(context) {
        const { hostUrl, appKey, appToken } = context.propsValue.authentication;
        const { fromYear, toYear, fromMonth, toMonth, fromDay, toDay } = context.propsValue;

        const order = new Order(hostUrl, appKey, appToken);

        const fromDate = new Date(`${fromYear}-${fromMonth || "01"}-${fromDay || "01"}`);
        const toDate = new Date(`${toYear}-${toMonth || "12"}-${toDay || "28"}`);

        return await order.getOrderList(fromDate, toDate);

    },
});
