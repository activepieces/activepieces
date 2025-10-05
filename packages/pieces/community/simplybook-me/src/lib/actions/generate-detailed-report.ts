
import { createAction, Property } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
import { SimplybookMeClient } from "../common/client";
import { simplybookMeProps } from "../common/props";

export const generateDetailedReport = createAction({
    auth: simplybookMeAuth,
    name: 'generate_detailed_report',
    displayName: 'Generate a Detailed Report',
    description: 'Generates a detailed report of bookings and revenue for a specified date range.',
    props: {
        startDate: Property.DateTime({
            displayName: 'Start Date',
            description: 'The start of the reporting period.',
            required: true,
        }),
        endDate: Property.DateTime({
            displayName: 'End Date',
            description: 'The end of the reporting period.',
            required: true,
        }),
        serviceId: simplybookMeProps.serviceId(false),
        unitId: simplybookMeProps.unitId(false),    
    },

    async run(context) {
        const { startDate, endDate, serviceId, unitId } = context.propsValue;
        const client = new SimplybookMeClient(context.auth);

        const filters = {
            startDate: startDate.split('T')[0],
            endDate: endDate.split('T')[0],
            serviceId: serviceId,
            unitId: unitId,
        };

        const bookings = await client.getBookings(filters);

        let totalRevenue = 0;
        const bookingStatusCounts: Record<string, number> = {};

        bookings.forEach(booking => {
            if (booking.payment && booking.payment.amount && booking.payment.status === 'paid') {
                totalRevenue += parseFloat(booking.payment.amount);
            }


            const status = booking.status || 'unknown';
            bookingStatusCounts[status] = (bookingStatusCounts[status] || 0) + 1;
        });

        return {
            summary_metrics: {
                total_bookings: bookings.length,
                total_revenue: totalRevenue,
                bookings_by_status: bookingStatusCounts,
                report_period: {
                    start: filters.startDate,
                    end: filters.endDate,
                }
            },
            detailed_bookings: bookings,
        };
    },
});
