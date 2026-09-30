import { OutputSchema } from '@activepieces/pieces-framework';

export const dateConvertSchemas = {
    calendarWeek: { fields: calendarWeekFields() },
    month: { fields: monthFields() },
    isWeekend: { fields: isWeekendFields() },
    switchTimeZone: { fields: switchTimeZoneFields() },
    holidays: {
        itemLabel: '{name}',
        fields: [
            {
                key: 'holidays',
                label: 'Holidays',
                value: '',
                listItems: [
                    { key: 'name', label: 'Name' },
                    { key: 'date', label: 'Date', format: 'date' },
                    { key: 'type', label: 'Type', description: 'The holiday type, for example public.' },
                    { key: 'start', label: 'Start', format: 'datetime' },
                    { key: 'end', label: 'End', format: 'datetime' },
                    { key: 'rule', label: 'Rule', description: 'The rule that defines when the holiday falls.' },
                ],
            },
        ],
    },
    bmi: {
        fields: [
            { key: 'bmi', label: 'BMI', format: 'number' },
            { key: 'classification', label: 'Classification' },
            { key: 'desirable_body_weight_kg', label: 'Desirable Body Weight (kg)', format: 'number' },
            { key: 'daily_calories_kcal', label: 'Daily Calories (kcal)', format: 'number' },
            { key: 'daily_carbohydrates_g', label: 'Daily Carbohydrates (g)', format: 'number' },
            { key: 'daily_protein_g', label: 'Daily Protein (g)', format: 'number' },
            { key: 'daily_fat_g', label: 'Daily Fat (g)', format: 'number' },
        ],
    },
    geoDistance: {
        fields: [
            { key: 'distance_km', label: 'Distance (km)', format: 'number' },
            { key: 'duration_hours', label: 'Duration Hours', format: 'number', description: 'Whole hours of the travel time.' },
            {
                key: 'duration_minutes',
                label: 'Duration Minutes',
                format: 'number',
                description: 'Minutes of the travel time on top of the whole hours.',
            },
        ],
    },
    csvToJson: {
        fields: [
            {
                key: 'rows',
                label: 'Rows',
                value: '',
                description:
                    'One object per CSV row, keyed by the header row, or field1, field2 and so on when the first row is data.',
            },
        ],
    },
    currency: {
        fields: [
            { key: 'converted_amount', label: 'Converted Amount', format: 'number' },
            { key: 'converted_currency', label: 'Converted Currency' },
            { key: 'original_amount', label: 'Original Amount', format: 'number' },
            { key: 'original_currency', label: 'Original Currency' },
            {
                key: 'rate_date',
                label: 'Rate Date',
                description: 'The date of the exchange rate used, written in the chosen Rate Date Format.',
            },
        ],
    },
    ipToGeo: {
        fields: [
            { key: 'ip', label: 'IP Address' },
            { key: 'country', label: 'Country' },
            { key: 'country_code', label: 'Country Code' },
            { key: 'region_code', label: 'Region Code' },
            { key: 'region_name', label: 'Region Name' },
            { key: 'city', label: 'City' },
            { key: 'zip', label: 'Postal Code' },
            { key: 'latitude', label: 'Latitude', format: 'number' },
            { key: 'longitude', label: 'Longitude', format: 'number' },
            { key: 'time_zone', label: 'Time Zone' },
            { key: 'isp', label: 'Internet Provider' },
            { key: 'organization', label: 'Organization' },
            { key: 'autonomous_system', label: 'Autonomous System' },
        ],
    },
    nationIso: { fields: nationIsoFields() },
    randomNumber: {
        fields: [{ key: 'number', label: 'Number', format: 'number' }],
    },
    randomCity: {
        fields: [
            { key: 'city', label: 'City' },
            { key: 'country', label: 'Country' },
        ],
    },
    randomName: { fields: randomNameFields() },
} satisfies Record<string, OutputSchema>;

function calendarWeekFields(): OutputSchema['fields'] {
    return [
        { key: 'week_number', label: 'Week Number', format: 'number', description: 'The ISO calendar week number, from 1 to 53.' },
        {
            key: 'working_date',
            label: 'Working Date',
            description: 'The date the week was calculated from, written in the chosen Output Format.',
        },
        {
            key: 'first_day_of_week',
            label: 'First Day of Week',
            description: 'The Monday of the week, written in the chosen Output Format.',
        },
        {
            key: 'last_day_of_week',
            label: 'Last Day of Week',
            description: 'The Sunday of the week, written in the chosen Output Format.',
        },
    ];
}

function monthFields(): OutputSchema['fields'] {
    return [
        { key: 'days_in_month', label: 'Days in Month', format: 'number' },
        {
            key: 'first_day_of_month',
            label: 'First Day of Month',
            description: 'Written in the chosen Output Format, or a Unix timestamp when Return Timestamps is on.',
        },
        {
            key: 'last_day_of_month',
            label: 'Last Day of Month',
            description: 'Written in the chosen Output Format, or a Unix timestamp when Return Timestamps is on.',
        },
        {
            key: 'last_workday_of_month',
            label: 'Last Workday of Month',
            description: 'The last Monday to Friday of the month.',
        },
        { key: 'workday_count', label: 'Workday Count', format: 'number', description: 'How many Monday to Friday days the month has.' },
        { key: 'workdays', label: 'Workdays', description: 'Every Monday to Friday of the month, earliest first.' },
        { key: 'workdays_reversed', label: 'Workdays (Latest First)', description: 'The same workdays, latest first.' },
        { key: 'saturdays', label: 'Saturdays' },
        { key: 'sundays', label: 'Sundays' },
    ];
}

function isWeekendFields(): OutputSchema['fields'] {
    return [
        { key: 'is_weekend', label: 'Is Weekend', format: 'boolean' },
        { key: 'weekday', label: 'Weekday', description: 'The English weekday name, for example Monday.' },
        { key: 'day_number', label: 'Day Number', format: 'number', description: 'The weekday as a number.' },
    ];
}

function switchTimeZoneFields(): OutputSchema['fields'] {
    return [
        {
            key: 'converted_time',
            label: 'Converted Time',
            description: 'The date and time in the destination time zone, written in the chosen Output Format.',
        },
        { key: 'time_zone', label: 'Time Zone', description: 'The destination time zone.' },
    ];
}

function nationIsoFields(): OutputSchema['fields'] {
    return [
        { key: 'iso_code', label: 'ISO Country Code' },
        { key: 'nation', label: 'Country Name' },
    ];
}

function randomNameFields(): OutputSchema['fields'] {
    return [
        { key: 'first_name', label: 'First Name' },
        { key: 'middle_name', label: 'Middle Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'full_name', label: 'Full Name', description: 'First and last name.' },
        { key: 'full_name_with_middle_name', label: 'Full Name with Middle Name' },
    ];
}
