import { wedofAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const addExecutionTag = createAction({
  auth: wedofAuth,
  name: 'addExecutionTag',
  displayName: 'Associer le run à wedof',
  description:
    "Permet d'associer une exécution de workflow à un ou plusieurs dossiers de (formations / certifications) dans wedof",
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    externalId: Property.Array({
      displayName: 'Numéros de dossier',
      description:
        'Entrez un ou plusieurs numéros de dossier à associer à cette exécution.',
      required: true,
      defaultValue: [],
    }),
  },
  async run(context) {
    for (const id of context.propsValue.externalId as string[]) {
      await context.tags.add({ name: id });
    }
    return {
      success: true,
      tagsAjoutes: context.propsValue.externalId,
    };
  },
});
