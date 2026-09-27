import { zeroCodeKitApi } from './client';

export const dateAndTimeApi = {
    calendarWeek,
    month,
    isWeekend,
    switchTimeZone,
    monthOptions,
};

async function calendarWeek({ apiKey, body }: DateAndTimeCall): Promise<CalendarWeekOutput> {
    const response = await zeroCodeKitApi.post<CalendarWeekResponse>({
        apiKey,
        path: '/dateandtime/calendarweek',
        body,
    });
    return {
        week_number: response.weekNumber ?? null,
        working_date: response.workingDate ?? null,
        first_day_of_week: response.firstDayOfWeek ?? null,
        last_day_of_week: response.lastDayOfWeek ?? null,
    };
}

async function month({ apiKey, body }: DateAndTimeCall): Promise<MonthOutput> {
    const response = await zeroCodeKitApi.post<MonthResponse>({
        apiKey,
        path: '/dateandtime/month',
        body,
    });
    return {
        days_in_month: response.daysInMonth ?? null,
        first_day_of_month: response.firstDayOfMonth ?? null,
        last_day_of_month: response.lastDayOfMonth ?? null,
        last_workday_of_month: response.lastWorkdayOfMonth ?? null,
        workday_count: response.workdays?.length ?? 0,
        workdays: response.workdays ?? [],
        workdays_reversed: response.workdaysReversed ?? [],
        saturdays: response.saturdays ?? [],
        sundays: response.sundays ?? [],
    };
}

async function isWeekend({ apiKey, body }: DateAndTimeCall): Promise<IsWeekendOutput> {
    const response = await zeroCodeKitApi.post<IsWeekendResponse>({
        apiKey,
        path: '/dateandtime/isweekend',
        body,
    });
    return {
        is_weekend: response.isWeekend ?? null,
        weekday: response.weekDay ?? null,
        day_number: response.dayNumber ?? null,
    };
}

async function switchTimeZone({ apiKey, body }: DateAndTimeCall): Promise<SwitchTimeZoneOutput> {
    const response = await zeroCodeKitApi.post<SwitchTimeZoneResponse>({
        apiKey,
        path: '/dateandtime/switchtimezone',
        body,
    });
    return {
        converted_time: response.convertedTime ?? null,
        time_zone: response.timeZone ?? null,
    };
}

function monthOptions({ returnTimestamps }: { returnTimestamps: boolean | undefined }) {
    return returnTimestamps === true ? { timeStamp: true } : undefined;
}

type DateAndTimeCall = {
    apiKey: string;
    body: Record<string, unknown>;
};

type DateValue = string | number;

type CalendarWeekResponse = {
    workingDate?: string;
    weekNumber?: number;
    firstDayOfWeek?: string;
    lastDayOfWeek?: string;
};

type MonthResponse = {
    daysInMonth?: number;
    firstDayOfMonth?: DateValue;
    lastDayOfMonth?: DateValue;
    lastWorkdayOfMonth?: DateValue;
    workdays?: DateValue[];
    workdaysReversed?: DateValue[];
    saturdays?: DateValue[];
    sundays?: DateValue[];
};

type IsWeekendResponse = {
    dayNumber?: number;
    weekDay?: string;
    isWeekend?: boolean;
};

type SwitchTimeZoneResponse = {
    convertedTime?: string;
    timeZone?: string;
};

export type CalendarWeekOutput = {
    week_number: number | null;
    working_date: string | null;
    first_day_of_week: string | null;
    last_day_of_week: string | null;
};

export type MonthOutput = {
    days_in_month: number | null;
    first_day_of_month: DateValue | null;
    last_day_of_month: DateValue | null;
    last_workday_of_month: DateValue | null;
    workday_count: number;
    workdays: DateValue[];
    workdays_reversed: DateValue[];
    saturdays: DateValue[];
    sundays: DateValue[];
};

export type IsWeekendOutput = {
    is_weekend: boolean | null;
    weekday: string | null;
    day_number: number | null;
};

export type SwitchTimeZoneOutput = {
    converted_time: string | null;
    time_zone: string | null;
};
