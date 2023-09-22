import { ContentFields } from 'contentful-management';

type FieldProcessor = (field: ContentFields, value: any) => any;

export const FieldProcessors: Record<string, FieldProcessor> = {
  Link: (field, value) => {
    return {
      sys: {
        type: 'Link',
        linkType: field.linkType,
        id: value,
      },
    };
  },
  Array: (field, value) => {
    if (field.items?.type === 'Symbol') {
      return value;
    }
    if (field.items?.type === 'Link') {
      return value.map((v: string) => ({
        sys: {
          type: 'Link',
          linkType: field.items?.linkType,
          id: v,
        },
      }));
    }
  },
  Basic: (field, value) => value,
};
