import { totalcmsApi, TotalCmsConnection } from './client';
import { totalcmsShape } from './shape';

export const totalcmsUpdate = {
  run,
};

async function run({
  auth,
  collection,
  id,
  fields,
}: {
  auth: TotalCmsConnection;
  collection: string;
  id: string;
  fields: unknown;
}) {
  const parsed = totalcmsShape.parseFields({ value: fields, label: 'Fields to Change' });
  if ('id' in parsed && String(parsed['id']).trim() !== id) {
    throw new Error('The object ID cannot be changed here. Use Duplicate Object to copy it under a new ID, then delete the old one.');
  }
  const rest = Object.fromEntries(Object.entries(parsed).filter(([key]) => key !== 'id'));
  if (Object.keys(rest).length === 0) {
    throw new Error('Fields to Change is empty. Add at least one field other than id.');
  }
  const existing = await totalcmsApi.findObject({ auth, collection, id });
  if (!existing) {
    throw new Error(`Object "${id}" was not found in collection "${collection}". Use Create Object to add it.`);
  }
  const object = await totalcmsApi.patchObject({ auth, collection, id, fields: rest });
  return totalcmsShape.generic({ collection, object });
}
