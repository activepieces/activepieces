import { BasePropertySchema, TPropertyValue } from './common';
import { PropertyType } from './property-type';
import { MarkdownVariant } from '@activepieces/core-piece-types';

export type MarkDownProperty = BasePropertySchema &
  TPropertyValue<
    undefined,
    PropertyType.MARKDOWN,
    false
  > & {
    variant?: MarkdownVariant;
  };
