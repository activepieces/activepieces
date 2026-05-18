import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
type SelectColor =
  | 'default'
  | 'gray'
  | 'brown'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red';

type DateDatabaseProperty = {
  id: string;
  name: string;
  type: 'date';
  date: Record<string, never>;
};
type CheckboxDatabaseProperty = {
  id: string;
  name: string;
  type: 'checkbox';
  checkbox: Record<string, never>;
};
type CreatedByDatabaseProperty = {
  id: string;
  name: string;
  type: 'created_by';
};
type CreatedTimeDatabaseProperty = {
  id: string;
  name: string;
  type: 'created_time';
  created_time: Record<string, never>;
};
type EmailDatabaseProperty = {
  id: string;
  name: string;
  type: 'email';
  email: Record<string, never>;
};
type FilesDatabaseProperty = {
  id: string;
  name: string;
  type: 'files';
  files: Record<string, never>;
};
type FormulaDatabaseProperty = {
  id: string;
  name: string;
  type: 'formula';
  formula: {
    expression: string;
  };
};
type LastEditedByDatabaseProperty = {
  id: string;
  name: string;
  type: 'last_edited_by';
  last_edited_by: Record<string, never>;
};
type LastEditedTimeDatabaseProperty = {
  id: string;
  name: string;
  type: 'last_edited_time';
  last_edited_time: Record<string, never>;
};
type MultiSelectDatabaseProperty = {
  id: string;
  name: string;
  type: 'multi_select';
  multi_select: {
    options: {
      id: string;
      name: string;
      color: SelectColor;
    }[];
  };
};
type NumberFormat =
  | 'number'
  | 'number_with_commas'
  | 'percent'
  | 'dollar'
  | 'canadian_dollar'
  | 'singapore_dollar'
  | 'euro'
  | 'pound'
  | 'yen'
  | 'ruble'
  | 'rupee'
  | 'won'
  | 'yuan'
  | 'real'
  | 'lira'
  | 'rupiah'
  | 'franc'
  | 'hong_kong_dollar'
  | 'new_zealand_dollar'
  | 'krona'
  | 'norwegian_krone'
  | 'mexican_peso'
  | 'rand'
  | 'new_taiwan_dollar'
  | 'danish_krone'
  | 'zloty'
  | 'baht'
  | 'forint'
  | 'koruna'
  | 'shekel'
  | 'chilean_peso'
  | 'philippine_peso'
  | 'dirham'
  | 'colombian_peso'
  | 'riyal'
  | 'ringgit'
  | 'leu'
  | 'argentine_peso'
  | 'uruguayan_peso'
  | 'peruvian_sol';
type NumberDatabaseProperty = {
  id: string;
  name: string;
  type: 'number';
  number: {
    format: NumberFormat;
  };
};
type PeopleDatabaseProperty = {
  id: string;
  name: string;
  type: 'people';
  people: Record<string, never>;
};
type PhoneNumberDatabaseProperty = {
  id: string;
  name: string;
  type: 'phone_number';
  phone_number: Record<string, never>;
};
type RelationDatabaseProperty = {
  id: string;
  name: string;
  type: 'relation';
  relation: {
    database_id: string;
    synced_property_id: string;
    synced_property_name: string;
  };
};
type RichTextDatabaseProperty = {
  id: string;
  name: string;
  type: 'rich_text';
  rich_text: Record<string, never>;
};
type RollupFunction =
  | 'count'
  | 'count_values'
  | 'empty'
  | 'not_empty'
  | 'unique'
  | 'show_unique'
  | 'percent_empty'
  | 'percent_not_empty'
  | 'sum'
  | 'average'
  | 'median'
  | 'min'
  | 'max'
  | 'range'
  | 'earliest_date'
  | 'latest_date'
  | 'date_range'
  | 'checked'
  | 'unchecked'
  | 'percent_checked'
  | 'percent_unchecked'
  | 'count_per_group'
  | 'percent_per_group'
  | 'show_original';

type RollupDatabaseProperty = {
  type: 'rollup';
  rollup: {
    rollup_property_name: string;
    relation_property_name: string;
    rollup_property_id: string;
    relation_property_id: string;
    function: RollupFunction;
  };
  id: string;
  name: string;
};
type SelectDatabaseProperty = {
  id: string;
  name: string;
  type: 'select';
  select: {
    options: {
      id: string;
      name: string;
      color: SelectColor;
    }[];
  };
};
type StatusDatabaseProperty = {
  id: string;
  name: string;
  type: 'status';
  status: {
    options: {
      id: string;
      name: string;
      color: SelectColor;
    }[];
    groups: {
      id: string;
      name: string;
      color: SelectColor;
      option_ids: Array<string>;
    };
  };
};
type TitleDatabaseProperty = {
  type: 'title';
  title: Record<string, never>;
  id: string;
  name: string;
};
type UrlDatabaseProperty = {
  type: 'url';
  url: Record<string, never>;
  id: string;
  name: string;
};
export type DatabaseProperty =
  | NumberDatabaseProperty
  | FormulaDatabaseProperty
  | SelectDatabaseProperty
  | MultiSelectDatabaseProperty
  | StatusDatabaseProperty
  | RelationDatabaseProperty
  | RollupDatabaseProperty
  | TitleDatabaseProperty
  | RichTextDatabaseProperty
  | UrlDatabaseProperty
  | PeopleDatabaseProperty
  | FilesDatabaseProperty
  | EmailDatabaseProperty
  | PhoneNumberDatabaseProperty
  | DateDatabaseProperty
  | CheckboxDatabaseProperty
  | CreatedByDatabaseProperty
  | CreatedTimeDatabaseProperty
  | LastEditedByDatabaseProperty
  | LastEditedTimeDatabaseProperty;

export interface NotionDatabase {
  object: 'database';
  id: string;
  created_time: string;
  created_by: {
    object: 'user';
    id: string;
  };
  last_edited_time: string;
  last_edited_by: {
    object: 'user';
    id: string;
  };
  is_inline: boolean;
  archived: boolean;
  url: string;
  public_url: string | null;
  cover:
    | {
        type: 'external';
        external: {
          url: string;
        };
      }
    | null
    | {
        type: 'file';
        file: {
          url: string;
          expiry_time: string;
        };
      }
    | null;
  properties: Record<string, DatabaseProperty>;
  parent:
    | {
        type: 'database_id';
        database_id: string;
      }
    | {
        type: 'page_id';
        page_id: string;
      }
    | {
        type: 'block_id';
        block_id: string;
      }
    | {
        type: 'workspace';
        workspace: true;
      };
}

export const NotionFieldMapping: Record<string, any> = {
  checkbox: {
    buildActivepieceType: (property: CheckboxDatabaseProperty) =>
      Property.Checkbox({
        displayName: property.name,
        required: false,
      }),
    buildNotionType: (property: DynamicPropsValue) => ({
      checkbox: property,
    }),
  },
  date: {
    buildActivepieceType: (property: DateDatabaseProperty) =>
      Property.DateTime({
        displayName: property.name,
        required: false,
      }),
    buildNotionType: (property: DynamicPropsValue) => ({
      date: {
        start: property,
      },
    }),
  },
  email: {
    buildActivepieceType: (property: EmailDatabaseProperty) =>
      Property.ShortText({
        displayName: property.name,
        required: false,
      }),
    buildNotionType: (property: DynamicPropsValue) => ({
      email: property,
    }),
  },
  // formula: Property.ShortText,
  select: {
    buildActivepieceType: (property: SelectDatabaseProperty) =>
      Property.StaticDropdown({
        displayName: property.name,
        required: false,
        options: {
          disabled: false,
          options: property.select.options?.map((option) => {
            return {
              label: option.name,
              value: option.name,
            };
          }),
        },
      }),
    buildNotionType: (property: DynamicPropsValue) => ({
      select: {
        name: property,
      },
    }),
  },
  multi_select: {
    buildActivepieceType: (property: MultiSelectDatabaseProperty) =>
      Property.StaticMultiSelectDropdown({
        displayName: property.name,
        required: false,
        options: {
          disabled: false,
          options: property.multi_select.options?.map((option) => {
            return {
              label: option.name,
              value: option.name,
            };
          }),
        },
      }),
    buildNotionType: (property: DynamicPropsValue) => ({
      multi_select: property.map((name: any) => ({ name: name })),
    }),
  },
  status: {
    buildActivepieceType: (property: StatusDatabaseProperty) =>
      Property.StaticDropdown({
        displayName: property.name,
        required: false,
        options: {
          disabled: false,
          options: property.status.options?.map((option) => {
            return {
              label: option.name,
              value: option.name,
            };
          }),
        },
      }),
    buildNotionType: (property: DynamicPropsValue) => ({
      status: {
        name: property,
      },
    }),
  },
  number: {
    buildActivepieceType: (property: NumberDatabaseProperty) =>
      Property.Number({
        displayName: property.name,
        required: false,
      }),
    buildNotionType: (property: DynamicPropsValue) => ({
      number: Number(property),
    }),
  },
  phone_number: {
    buildActivepieceType: (property: PhoneNumberDatabaseProperty) =>
      Property.Number({
        displayName: property.name,
        required: false,
      }),
    buildNotionType: (property: DynamicPropsValue) => ({
      phone_number: property,
    }),
  },
  rich_text: {
    buildActivepieceType: (property: RichTextDatabaseProperty) =>
      Property.LongText({ displayName: property.name, required: false }),
    buildNotionType: (property: DynamicPropsValue) => ({
      rich_text: [
        {
          type: 'text',
          text: {
            content: property,
          },
        },
      ],
    }),
  },
  title: {
    buildActivepieceType: (property: TitleDatabaseProperty) =>
      Property.ShortText({ displayName: property.name, required: false }),
    buildNotionType: (property: DynamicPropsValue) => ({
      title: [
        {
          type: 'text',
          text: {
            content: property,
          },
        },
      ],
    }),
  },
  url: {
    buildActivepieceType: (property: UrlDatabaseProperty) =>
      Property.ShortText({
        displayName: property.name,
        required: false,
      }),
    buildNotionType: (property: DynamicPropsValue) => ({
      url: property,
    }),
  },
  people: {
    buildActivepieceType: undefined,
    buildNotionType: (property: DynamicPropsValue) => ({
      people: property.map((id: any) => ({ id: id })),
    }),
  },
};
