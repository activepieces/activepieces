import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';

export const advancedMapping = createAction({
  audience: 'both',
  name: 'advanced_mapping',
  classification: 'READ',
  displayName: 'Advanced Mapping',
  description: 'Rename, pick or nest fields from earlier steps into one object.',
  aiMetadata: { description: 'Reshapes data already present in the run by returning the Mapping object you define with every template reference inside it resolved (e.g. {{trigger.body.email}}), so you can rename, subset, or nest fields into a clean payload for a later step. Pick it when you only need to restructure or rekey existing values, not transform them - prefer text-helper for string edits, date-helper for date conversion, and the JSON piece to parse or stringify. Requires the Mapping JSON object; read-only and idempotent.', idempotent: true },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    instructions: Property.MarkDown({
      value: 'This step returns the object below, with inserted values filled in.',
      variant: MarkdownVariant.INFO,
    }),
    mapping: Property.Json({
      displayName: 'Mapping',
      description: 'Keys become output fields. Put inserted text values in "quotes".',
      required: true,
      defaultValue: {
        newProperty: 'oldProperty',
      },
    }),
  },
  async run(ctx) {
    return ctx.propsValue.mapping;
  },
});
