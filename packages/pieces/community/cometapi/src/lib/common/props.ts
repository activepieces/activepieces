import { DropdownState, Property } from '@activepieces/pieces-framework';
import { cometApiAuth } from '../auth';
import { cometApiApi } from './api';

function model<R extends boolean>({
  required,
  displayName = 'Model',
  description,
}: PropParams<R>) {
  return Property.Dropdown({
    displayName,
    description,
    auth: cometApiAuth,
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({
          placeholder: 'Please connect your account first.',
        });
      }

      const models = await cometApiApi.listModels({ auth });

      return {
        disabled: false,
        options: models.map((model) => ({
          label: `${model.id} (${model.owned_by})`,
          value: model.id,
        })),
      };
    },
  });
}

function disabledOptions({
  placeholder,
}: {
  placeholder: string;
}): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const cometApiProps = { model };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
