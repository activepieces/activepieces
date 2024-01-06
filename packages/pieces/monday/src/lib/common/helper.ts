import {
  DynamicPropsValue,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { MondayColumn } from './models';

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

// creates activepiece prop type for monday column
export const ActivepiecesPropConverter = (column: MondayColumn) => {
  switch (column.type) {
    case 'checkbox':
      return Property.Checkbox({
        displayName: column.title,
        required: false,
      });
    case 'board_relation':
      return Property.ShortText({
        displayName: column.title,
        description:
          'A list of item IDs to connect with. The items must be on boards that are connected to the column. Example: [125345, 5846475]',
        required: false,
        validators: [Validators.pattern(/^\[\d+(,\d+)*]$/)],
      });
    case 'country':
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `The ISO 2-letter code and the country's name are separated by a dash. Example: US-United States`,
      });
    case 'date':
      return Property.DateTime({
        displayName: column.title,
        required: false,
        description: 'Use YYYY-MM-DD HH:mm:ss format.',
      });
    case 'dependency':
      return Property.ShortText({
        displayName: column.title,
        description:
          'A list of item IDs from the same board. Example: [188392, 20339]',
        required: false,
        validators: [Validators.pattern(/^\[\d+(,\d+)*]$/)],
      });
    case 'dropdown':
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
    case 'email':
    case 'link':
    case 'text':
      return Property.ShortText({
        displayName: column.title,
        required: false,
      });
    case 'hour':
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Represent time in 24-hour format, like '16:30' or '2:00', ensuring removal of leading zeroes from data (e.g., send '9' instead of '09').`,
        validators: [Validators.pattern(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/)],
      });
    case 'location':
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter location details in the following format: **latitude|longitude|address(optional)**. For example: "37.7749|-122.4194|San Francisco, CA, USA."`,
      });
    case 'long_text':
      return Property.LongText({
        displayName: column.title,
        required: false,
      });
    case 'numbers':
      return Property.Number({
        displayName: column.title,
        required: false,
      });
    case 'phone':
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter your phone number along with the country's ISO 2-letter code, separated by a dash. For ezample, 1234567890-US.`,
      });
    case 'rating':
      return Property.Number({
        displayName: column.title,
        required: false,
        description: `A number between 1 and 5.For example, 3.`,
        validators: [Validators.inRange(1, 5)],
      });
    case 'status':
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
    case 'timeline':
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter the start and end dates in the YYYY-MM-DD format, separated by a symbol of semicolon(;) symbol. For example: '2022-01-01;2022-12-31`,
        validators: [
          Validators.pattern(/^\d{4}-\d{2}-\d{2};\d{4}-\d{2}-\d{2}$/),
        ],
      });
    case 'week':
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter the start and end dates in the YYYY-MM-DD format, separated by a symbol of semicolon(;) symbol. The dates must be 7 days apart (inclusive of the first and last date).\n For example: '2019-06-10;2019-06-16`,
        validators: [
          Validators.pattern(/^\d{4}-\d{2}-\d{2};\d{4}-\d{2}-\d{2}$/),
        ],
      });
    case 'world_clock':
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter the timezone in the 'Continent/City' format, for example, Europe/London.`,
      });
    default:
      return null;
  }
};
export const MondayColumnValueConverter = (
  columnType: string,
  propValue: DynamicPropsValue
) => {
  switch (columnType) {
    case 'checkbox':
      return {
        checked: propValue ? 'true' : 'false',
      };
    case 'board_relation':
    case 'dependency':
      return {
        item_ids: JSON.parse(propValue as unknown as string),
      };
    case 'country':
      return {
        countryCode: propValue.split('-')[0],
        countryName: propValue.split('-')[1],
      };
    case 'date':
      let datevalue = dayjs(propValue as unknown as string);
      if (!datevalue.isValid()) {
        datevalue = dayjs();
      }
      return {
        date: datevalue.format('YYYY-MM-DD'),
        time: datevalue.format('HH:mm:ss'),
      };
    case 'dropdown':
      return {
        labels: propValue,
      };
    case 'email':
      return {
        email: propValue,
        text: propValue,
      };
    case 'hour':
      const [hour, minute] = propValue.split(':');
      return {
        hour: Number(hour) ?? 0,
        minute: Number(minute) ?? 0,
      };
    case 'link':
      return {
        url: propValue,
        text: propValue,
      };
    case 'location':
      const [lat, lng, address] = propValue.split('|');
      return {
        lat: lat ?? '',
        lng: lng ?? '',
        address: address ?? '',
      };
    case 'long_text':
      return {
        text: propValue,
      };
    case 'numbers':
      return String(propValue);
    case 'people':
      const res: { id: string; kind: string }[] = [];
      if (Array.isArray(propValue)) {
        propValue.forEach((person) => {
          res.push({ id: person, kind: 'person' });
        });
      }
      return {
        personsAndTeams: res,
      };
    case 'phone':
      const [phone, countryCode] = propValue.split('-');
      return {
        phone: `+${phone}`,
        countryShortName: countryCode,
      };
    case 'rating':
      return {
        rating: Number(propValue),
      };
    case 'status':
      return {
        label: propValue,
      };
    case 'text':
      return propValue;
    case 'timeline':
      return {
        from: propValue.split(';')[0],
        to: propValue.split(';')[1],
      };
    case 'week':
      return {
        startDate: propValue.split(';')[0],
        endDate: propValue.split(';')[1],
      };
    case 'world_clock':
      return {
        timezone: propValue,
      };
    default:
      return null;
  }
};
