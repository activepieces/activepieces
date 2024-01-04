import {
  DynamicPropsValue,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { MondayColumn } from './models';
export const MondayColumnMapping: Record<string, any> = {
  status: {
    buildActivepieceType: (column: MondayColumn) => {
      const lables = JSON.parse(column.settings_str).labels;
      const options: { label: string; value: string }[] = [];
      Object.keys(lables).forEach((key) => {
        if (lables[key] !== '') {
          options.push({ value: lables[key], label: lables[key] });
        }
      });
      return Property.StaticDropdown({
        displayName: column.title,
        required: false,
        options: {
          disabled: false,
          options: options,
        },
      });
    },
    buildMondayType: (property: string) => ({
      label: property,
    }),
  },
  dropdown: {
    buildActivepieceType: (column: MondayColumn) => {
      const labels: { id: string; name: string }[] = JSON.parse(
        column.settings_str
      ).labels;
      return Property.StaticMultiSelectDropdown({
        displayName: column.title,
        required: false,
        options: {
          disabled: false,
          options:
            labels.length > 0
              ? labels.map((label) => {
                  return {
                    label: label.name,
                    value: label.name,
                  };
                })
              : [],
        },
      });
    },
    buildMondayType: (property: DynamicPropsValue) => ({
      labels: property,
    }),
  },
  email: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.ShortText({
        displayName: column.title,
        required: false,
      }),
    buildMondayType: (property: string) => ({
      email: property,
      text: property,
    }),
  },
  link: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.ShortText({
        displayName: column.title,
        required: false,
      }),
    buildMondayType: (propety: string) => ({
      url: propety,
      text: propety,
    }),
  },
  numbers: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.Number({
        displayName: column.title,
        required: false,
      }),
    buildMondayType: (property: string | number) => String(property),
  },
  long_text: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.LongText({
        displayName: column.title,
        required: false,
      }),
    buildMondayType: (property: string) => ({
      text: property,
    }),
  },
  text: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.ShortText({
        displayName: column.title,
        required: false,
      }),
    buildMondayType: (property: string) => property,
  },
  checkbox: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.Checkbox({
        displayName: column.title,
        required: false,
      }),
    buildMondayType: (property: Boolean) => ({
      checked: property ? 'true' : 'false',
    }),
  },
  date: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.DateTime({
        displayName: column.title,
        required: false,
        description: 'Use YYYY-MM-DD HH:mm:ss format.',
      }),
    buildMondayType: (property: string) => {
      let datevalue = dayjs(property);
      if (!datevalue.isValid()) {
        datevalue = dayjs();
      }
      return {
        date: datevalue.format('YYYY-MM-DD'),
        time: datevalue.format('HH:mm:ss'),
      };
    },
  },
  board_relation: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.Array({
        displayName: column.title,
        description:
          'A list of item IDs to connect with. The items must be on boards that are connected to the column. Example: [125345, 5846475]',
        required: false,
      }),
    buildMondayType: (property: DynamicPropsValue) => {
      const values: number[] = [];
      if (Array.isArray(property)) {
        property.forEach((element) => {
          if (!isNaN(Number(element))) {
            values.push(Number(element));
          }
        });
      }
      return {
        item_ids: values,
      };
    },
  },
  buildMondayType: (property: DynamicPropsValue) => {
    const values: number[] = [];
    if (Array.isArray(property)) {
      property.forEach((element) => {
        if (!isNaN(Number(element))) {
          values.push(Number(element));
        }
      });
    }
    return {
      item_ids: values,
    };
  },
  dependency: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.Array({
        displayName: column.title,
        description:
          'A list of item IDs from the same board. Example: [188392, 20339]',
        required: false,
      }),
    buildMondayType: (property: DynamicPropsValue) => {
      const values: number[] = [];
      if (Array.isArray(property)) {
        property.forEach((element) => {
          if (!isNaN(Number(element))) {
            values.push(Number(element));
          }
        });
      }
      return {
        item_ids: values,
      };
    },
  },
  country: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.ShortText({
        displayName: column.title,
        required: false,
        description: `The ISO 2-letter code and the country's name are separated by a dash. Example: US-United States`,
      }),

    buildMondayType: (property: string) => {
      const [countryCode, countryName] = property.split('-');
      return {
        countryCode: countryCode,
        countryName: countryName,
      };
    },
  },
  hour: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Represent time in 24-hour format, like '16:30' or '2:00', ensuring removal of leading zeroes from data (e.g., send '9' instead of '09').`,
      }),
    buildMondayType: (property: DynamicPropsValue) => {
      let [hour, minute] = property.split(':');
      console.log('INSIDE HOURS');
      console.log(typeof Number(hour));
      return {
        hour: Number(hour) ?? 0,
        minute: Number(minute) ?? 0,
      };
    },
  },
  location: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter location details in the following format: **latitude|longitude|address(optional)**. For example: "37.7749|-122.4194|San Francisco, CA, USA."`,
      }),
    buildMondayType: (property: DynamicPropsValue) => {
      const [lat, lng, address] = property.split('|');
      return {
        lat: lat ?? '',
        lng: lng ?? '',
        address: address ?? '',
      };
    },
  },
  phone: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter your phone number along with the country's ISO 2-letter code, separated by a dash. For ezample, 1234567890-US.`,
      }),
    buildMondayType: (property: string) => {
      const [phone, countryCode] = property.split('-');
      return {
        phone: `+${phone}`,
        countryShortName: countryCode,
      };
    },
  },
  rating: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.Number({
        displayName: column.title,
        required: false,
        description: `A number between 1 and 5.For example, 3.`,
        validators: [Validators.inRange(1, 5)],
      }),
    buildMondayType: (property: string) => ({ rating: Number(property) }),
  },
  timeline: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter the start and end dates in the YYYY-MM-DD format, separated by a symbol of semicolon(;) symbol. For example: '2022-01-01;2022-12-31`,
      }),
    buildMondayType: (property: string) => {
      let [startDate, endDate] = property.split(';');
      return {
        from: startDate,
        to: endDate,
      };
    },
  },
  week: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter the start and end dates in the YYYY-MM-DD format, separated by a symbol of semicolon(;) symbol. The dates must be 7 days apart (inclusive of the first and last date).\n For example: '2019-06-10;2019-06-16`,
      }),
    buildMondayType: (property: string) => {
      let [startDate, endDate] = property.split(';');
      return {
        week: {
          startDate: startDate,
          endDate: endDate,
        },
      };
    },
  },
  world_clock: {
    buildActivepieceType: (column: MondayColumn) =>
      Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter the timezone in the 'Continent/City' format, for example, Europe/London.`,
      }),
    buildMondayType: (property: string) => ({
      timezone: property,
    }),
  },
};

type ColumnIdTypeMap = {
  [key: string]: string;
};
export function generateColumnIdTypeMap(
  columns: MondayColumn[]
): ColumnIdTypeMap {
  const result: ColumnIdTypeMap = {};
  for (const column of columns) {
    result[column.id] = column.type;
  }
  return result;
}
