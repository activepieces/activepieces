import { Property } from '@activepieces/pieces-framework';

export const decodeEmbeddings = (embeddings: string | number[] | string[] | number[][]) => {
  if (typeof embeddings[0] === 'number' || (typeof embeddings[0] === 'string' && embeddings[0].length === 1)) {
    embeddings = [embeddings] as string[] | number[][];
  }
  if (embeddings.length === 0) throw new Error('Embeddings must contain one element minimum')
  if (typeof embeddings[0] === 'string') {
    return (embeddings as string[]).map(embedding => new Float32Array(new Uint8Array(Buffer.from(embedding, 'base64')).buffer))
  } else {
    return (embeddings as number[][]).map(embedding => new Float32Array(embedding))
  }
}

export const filteringProps = {
  must: Property.Object({
    displayName: 'Must Have',
    description:
      'If the point have this property in his payload it will be selected',
    required: true,
  }),
  must_not: Property.Object({
    displayName: 'Must Not Have',
    description:
      'If the point have this property in his payload it will not be selected',
    required: true,
  }),
};

export const seclectPointsProps = {
  getPointsBy: Property.StaticDropdown({
    displayName: 'Choose Points By',
    description: 'The method to use to get the points',
    options: {
      options: [
        { label: 'Ids', value: 'Ids' },
        { label: 'Filtering', value: 'Filtering' },
      ],
    },
    defaultValue: 'Ids',
    required: true,
  }),
  infosToGetPoint: Property.DynamicProperties({
    displayName: 'By ids or filtering',
    description: 'The infos to select points',
    refreshers: ['getPointsBy'],
    props: async (propsValue) => {
      const { getPointsBy } = propsValue as unknown as {
        getPointsBy: 'Ids' | 'Filtering';
      };
      if (getPointsBy === 'Ids')
        return {
          ids: Property.ShortText({
            displayName: 'Ids',
            description: 'The ids of the points to choose',
            required: true,
          }),
        };
      return filteringProps as any;
    },
    required: true,
  }),
};

export const convertToFilter = (infosToGetPoint: {
  must: any;
  must_not: any;
}) => {
  type Tfilter = (
    | { has_id: (string | number)[] }
    | { key: string; match: { value: any } }
  )[];
  const filter = { must: [], must_not: [] } as {
    must: Tfilter;
    must_not: Tfilter;
  };

  for (const getKey in infosToGetPoint) {
    for (const key in infosToGetPoint[getKey as keyof typeof filter]) {
      const value = infosToGetPoint[getKey as keyof typeof filter][key];

      if (['id', 'ids'].includes(key.toLocaleLowerCase())) {
        filter[getKey as keyof typeof filter].push({
          has_id: value instanceof Array ? value : [value],
        });
        break;
      }

      const destrucArray = (values: any) => {
        for (const value of values) {
          filter[getKey as keyof typeof filter].push({ key, match: { value } });
          if (value instanceof Array) destrucArray(value);
        }
      };

      if (value instanceof Array) {
        destrucArray(value);
        break;
      }

      filter[getKey as keyof typeof filter].push({ key, match: { value } });
    }
  }
  return filter;
};

export const collectionName = Property.ShortText({
  displayName: 'Collection Name',
  description: 'The name of the collection needed for this action',
  required: true,
})
