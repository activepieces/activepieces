import { Property } from '@activepieces/pieces-framework';

export const nuelinkAiProps = {
  brandId,
  collectionId,
  idText,
};

function brandId() {
  return Property.ShortText({
    displayName: 'Brand ID',
    description: 'The numeric brand ID from nuelink_list_brands.',
    required: true,
  });
}

function collectionId<R extends boolean>({ required, description }: { required: R; description: string }) {
  return Property.ShortText({
    displayName: 'Collection ID',
    description,
    required,
  });
}

function idText<R extends boolean>({ displayName, description, required }: { displayName: string; description: string; required: R }) {
  return Property.ShortText({ displayName, description, required });
}
