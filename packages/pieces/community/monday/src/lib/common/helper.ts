import {
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { isEmpty } from '@activepieces/shared';
import dayjs from 'dayjs';
import { MondayColumnType } from './constants';
import { ColumnValue, MondayColumn } from './models';

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
export const convertMondayColumnToActivepiecesProp = (column: MondayColumn) => {
  switch (column.type) {
    case MondayColumnType.CHECKBOX:
      return Property.Checkbox({
        displayName: column.title,
        required: false,
      });
    case MondayColumnType.BOARD_RELATION:
      return Property.ShortText({
        displayName: column.title,
        description:
          'A list of item IDs to connect with. The items must be on boards that are connected to the column. Example: [125345, 5846475]',
        required: false,
      });
    case MondayColumnType.COUNTRY:
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `The ISO 2-letter code and the country's name are separated by a dash. Example: US-United States`,
      });
    case MondayColumnType.DATE:
      return Property.DateTime({
        displayName: column.title,
        required: false,
        description: 'Use YYYY-MM-DD HH:mm:ss format.',
      });
    case MondayColumnType.DEPENDENCY:
      return Property.ShortText({
        displayName: column.title,
        description:
          'A list of item IDs from the same board. Example: [188392, 20339]',
        required: false,
      });
    case MondayColumnType.DROPDOWN: {
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
    }
    case MondayColumnType.EMAIL:
    case MondayColumnType.LINK:
    case MondayColumnType.TEXT:
      return Property.ShortText({
        displayName: column.title,
        required: false,
      });
    case MondayColumnType.HOUR:
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Represent time in 24-hour format, like '16:30' or '2:00', ensuring removal of leading zeroes from data (e.g., send '9' instead of '09').`,
      });
    case MondayColumnType.LOCATION:
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter location details in the following format: **latitude|longitude|address(optional)**. For example: "37.7749|-122.4194|San Francisco, CA, USA."`,
      });
    case MondayColumnType.LONG_TEXT:
      return Property.LongText({
        displayName: column.title,
        required: false,
      });
    case MondayColumnType.NUMBERS:
      return Property.Number({
        displayName: column.title,
        required: false,
      });
    case MondayColumnType.PHONE:
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter your phone number along with the country's ISO 2-letter code, separated by a dash. For ezample, 1234567890-US.`,
      });
    case MondayColumnType.RATING:
      return Property.Number({
        displayName: column.title,
        required: false,
        description: `A number between 1 and 5.For example, 3.`,
      });
    case MondayColumnType.STATUS: {
      const labels = JSON.parse(column.settings_str).labels;
      const options: { label: string; value: string }[] = [];
      Object.keys(labels).forEach((key) => {
        if (labels[key] !== '') {
          options.push({ value: labels[key], label: labels[key] });
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
    }
    case MondayColumnType.TIMELINE:
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter the start and end dates in the YYYY-MM-DD format, separated by a symbol of semicolon(;) symbol. For example: '2022-01-01;2022-12-31`,
      });
    case MondayColumnType.WEEK:
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter the start and end dates in the YYYY-MM-DD format, separated by a symbol of semicolon(;) symbol. The dates must be 7 days apart (inclusive of the first and last date).\n For example: '2019-06-10;2019-06-16`,
  
      });
    case MondayColumnType.WORLD_CLOCK:
      return Property.ShortText({
        displayName: column.title,
        required: false,
        description: `Enter the timezone in the 'Continent/City' format, for example, Europe/London.`,
      });
    default:
      return null;
  }
};
export const convertPropValueToMondayColumnValue = (
  columnType: string,
  propValue: DynamicPropsValue
) => {
  switch (columnType) {
    case MondayColumnType.CHECKBOX:
      return {
        checked: propValue ? 'true' : 'false',
      };
    case MondayColumnType.BOARD_RELATION:
    case MondayColumnType.DEPENDENCY:
      return {
        item_ids: JSON.parse(propValue as unknown as string),
      };
    case MondayColumnType.COUNTRY:
      return {
        countryCode: propValue.split('-')[0],
        countryName: propValue.split('-')[1],
      };
    case MondayColumnType.DATE: {
      let datevalue = dayjs(propValue as unknown as string);
      if (!datevalue.isValid()) {
        datevalue = dayjs();
      }
      return {
        date: datevalue.format('YYYY-MM-DD'),
        time: datevalue.format('HH:mm:ss'),
      };
    }
    case MondayColumnType.DROPDOWN:
      return {
        labels: propValue,
      };
    case MondayColumnType.EMAIL:
      return {
        email: propValue,
        text: propValue,
      };
    case MondayColumnType.HOUR: {
      const [hour, minute] = propValue.split(':');
      return {
        hour: Number(hour) ?? 0,
        minute: Number(minute) ?? 0,
      };
    }
    case MondayColumnType.LINK:
      return {
        url: propValue,
        text: propValue,
      };
    case MondayColumnType.LOCATION: {
      const [lat, lng, address] = propValue.split('|');
      return {
        lat: lat ?? '',
        lng: lng ?? '',
        address: address ?? '',
      };
    }
    case MondayColumnType.LONG_TEXT:
      return {
        text: propValue,
      };
    case MondayColumnType.NUMBERS:
      return String(propValue);
    case MondayColumnType.PEOPLE: {
      const res: { id: string; kind: string }[] = [];
      if (Array.isArray(propValue)) {
        propValue.forEach((person) => {
          res.push({ id: person, kind: 'person' });
        });
      }
      return {
        personsAndTeams: res,
      };
    }
    case MondayColumnType.PHONE: {
      const [phone, countryCode] = propValue.split('-');
      return {
        phone: `+${phone}`,
        countryShortName: countryCode,
      };
    }
    case MondayColumnType.RATING:
      return {
        rating: Number(propValue),
      };
    case MondayColumnType.STATUS:
      return {
        label: propValue,
      };
    case MondayColumnType.TEXT:
      return propValue;
    case MondayColumnType.TIMELINE:
      return {
        from: propValue.split(';')[0],
        to: propValue.split(';')[1],
      };
    case MondayColumnType.WEEK:
      return {
        startDate: propValue.split(';')[0],
        endDate: propValue.split(';')[1],
      };
    case MondayColumnType.WORLD_CLOCK:
      return {
        timezone: propValue,
      };
    default:
      return null;
  }
};

export const parseMondayColumnValue = (columnValue: ColumnValue) => {
  switch (columnValue.type) {
    case MondayColumnType.BUTTON:
      return columnValue.label;
    case MondayColumnType.CHECKBOX:
      return JSON.parse(columnValue.value)?.checked ?? false;
    case MondayColumnType.BOARD_RELATION:
      return columnValue.linked_item_ids ?? [];
    case MondayColumnType.DEPENDENCY:
      return JSON.parse(columnValue.linked_item_ids ?? '[]');
    case MondayColumnType.SUBTASKS: {
      const res: number[] = [];
      if (!isEmpty(JSON.parse(columnValue.value))) {
        JSON.parse(columnValue.value).linkedPulseIds.map(
          (item: { linkedPulseId: number }) => {
            res.push(item.linkedPulseId);
          }
        );
      }
      return res;
    }
    case MondayColumnType.COLOR_PICKER:
      return JSON.parse(columnValue.value)?.color.hex ?? null;
    case MondayColumnType.COUNTRY:
      return JSON.parse(columnValue.value)?.countryName ?? null;
    case MondayColumnType.CREATION_LOG:
      return JSON.parse(columnValue.value)?.created_at ?? null;
    case MondayColumnType.DATE: {
      if (isEmpty(columnValue.value)) {
        return null;
      }
      const dateTime = JSON.parse(columnValue.value);
      return `${dateTime.date} ${dateTime.time}`;
    }
    case MondayColumnType.DOC:
      return JSON.parse(columnValue.value)?.files[0].linkToFile ?? null;
    case MondayColumnType.DROPDOWN:
      return JSON.parse(columnValue.value)?.ids ?? [];
    case MondayColumnType.EMAIL:
      return JSON.parse(columnValue.value)?.email ?? null;
    case MondayColumnType.FILE:
      return columnValue.text;
    case MondayColumnType.HOUR: {
      if (isEmpty(columnValue.value)) {
        return null;
      }
      const hourTime = JSON.parse(columnValue.value);
      return `${hourTime.hour}:${hourTime.minute}`;
    }
    case MondayColumnType.ITEM_ID:
      return JSON.parse(columnValue.value)?.item_id ?? null;
    case MondayColumnType.LAST_UPDATED:
      return JSON.parse(columnValue.value).updated_at;
    case MondayColumnType.LINK:
      return JSON.parse(columnValue.value)?.url ?? null;
    case MondayColumnType.LOCATION:
      return JSON.parse(columnValue.value)?.address ?? null;
    case MondayColumnType.LONG_TEXT:
      return JSON.parse(columnValue.value)?.text ?? null;
    case MondayColumnType.MIRROR:
      return null;
    case MondayColumnType.NUMBERS:
      return Number(JSON.parse(columnValue.value));
    case MondayColumnType.PEOPLE: {
      const people: number[] = [];
      if (!isEmpty(columnValue.value)) {
        JSON.parse(columnValue.value).personsAndTeams.map(
          (item: { id: number; kind: string }) => {
            people.push(item.id);
          }
        );
      }
      return people;
    }
    case MondayColumnType.PHONE:
      return JSON.parse(columnValue.value)?.phone ?? null;
    case MondayColumnType.RATING:
      return JSON.parse(columnValue.value)?.rating ?? null;
    case MondayColumnType.STATUS:
      return columnValue.label;
    case MondayColumnType.TAGS:
      return columnValue.tags.map((item: { name: string }) => item.name);
    case MondayColumnType.TEXT:
      return JSON.parse(columnValue.value);
    case MondayColumnType.TIMELINE: {
      if (isEmpty(columnValue.value)) {
        return null;
      }
      const timeline = JSON.parse(columnValue.value);
      return { from: timeline.from, to: timeline.to };
    }
    case MondayColumnType.TIME_TRACKING:
      return JSON.parse(columnValue.value)?.duration ?? null;
    case MondayColumnType.VOTE:
      return columnValue?.vote_count ?? 0;
    case MondayColumnType.WEEK: {
      return {
        startDate: columnValue.start_date,
        endDate: columnValue.end_date,
      };
    }
    case MondayColumnType.WORLD_CLOCK:
      return JSON.parse(columnValue.value)?.timezone ?? null;
  }
};
