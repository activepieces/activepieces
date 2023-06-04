import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, emptyToNull, makeClient, reformatDate } from "../../common";
import { AbsenceStatus, AbsenceType } from "../../common/models/absence";

export default createAction({
    name: 'create_absence',
    displayName: 'Create Absence',
    description: 'Creates a absence in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        date_since: Property.DateTime({
            displayName: 'Start Date',
            required: true
        }),
        date_until: Property.DateTime({
            displayName: 'End Date',
            required: true
        }),
        type: clockodoCommon.absenceType(true),
        user_id: clockodoCommon.user_id(false),
        half_days: Property.Checkbox({
            displayName: 'Half Days',
            required: false
        }),
        approved: Property.Checkbox({
            displayName: 'Approved',
            required: false
        }),
        note: Property.LongText({
            displayName: 'Note',
            required: false
        }),
        sick_note: Property.Checkbox({
            displayName: 'Sick Note',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.createAbsence({
            date_since: reformatDate(context.propsValue.date_since) as string,
            date_until: reformatDate(context.propsValue.date_until) as string,
            type: context.propsValue.type as AbsenceType,
            users_id: context.propsValue.user_id,
            count_days: context.propsValue.half_days ? 0.5 : 1,
            status: context.propsValue.approved ? AbsenceStatus.APPROVED : AbsenceStatus.REQUESTED,
            note: emptyToNull(context.propsValue.note),
            sick_note: context.propsValue.sick_note
        })
        return res.absence
    }
})