import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { Filament } from '../common/types';

export const listFilamentsAction = createAction({
  auth: simplyprintAuth,
  name: 'list_filaments',
  displayName: 'List Filaments',
  description: 'List filament spools in your SimplyPrint account, with optional filters and sort.',
  props: {
    materialType: Property.ShortText({
      displayName: 'Material type filter',
      description: 'Substring match against material type, e.g. `PLA`, `PETG`. Leave empty for no filter.',
      required: false,
    }),
    brand: Property.ShortText({
      displayName: 'Brand filter',
      description: 'Substring match against brand name. Leave empty for no filter.',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color filter',
      description: 'Substring match against color name, hex, or group. Leave empty for no filter.',
      required: false,
    }),
    assigned: Property.StaticDropdown<'any' | 'true' | 'false'>({
      displayName: 'Assignment filter',
      description: 'Whether to include only assigned spools, only unassigned, or both.',
      required: false,
      defaultValue: 'any',
      options: {
        options: [
          { label: 'Any (no filter)', value: 'any' },
          { label: 'Assigned to a printer only', value: 'true' },
          { label: 'Unassigned only', value: 'false' },
        ],
      },
    }),
    empty: Property.StaticDropdown<'any' | 'true' | 'false'>({
      displayName: 'Empty filter',
      description: 'Filter by empty / non-empty status. "Empty" means filament left ≤ 0 or marked as emptied.',
      required: false,
      defaultValue: 'any',
      options: {
        options: [
          { label: 'Any (no filter)', value: 'any' },
          { label: 'Only empty', value: 'true' },
          { label: 'Only non-empty', value: 'false' },
        ],
      },
    }),
    printerId: Property.Number({
      displayName: 'Printer ID filter',
      description: 'Only return spools currently assigned to this printer (numeric ID).',
      required: false,
    }),
    sortBy: Property.StaticDropdown<'created' | 'last_used' | 'left' | 'brand' | 'color'>({
      displayName: 'Sort by',
      description: 'Field to sort the result list by. Leave empty to use backend default ordering.',
      required: false,
      options: {
        options: [
          { label: 'Created date', value: 'created' },
          { label: 'Last used date', value: 'last_used' },
          { label: 'Filament left', value: 'left' },
          { label: 'Brand', value: 'brand' },
          { label: 'Color', value: 'color' },
        ],
      },
    }),
    sortDir: Property.StaticDropdown<'asc' | 'desc'>({
      displayName: 'Sort direction',
      description: 'Only applied when "Sort by" is set.',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Max results (limit)',
      description: 'Cap on returned spools (1–100). Leave empty for no cap. Backend has no offset-pagination on this endpoint, so this is the only cap available.',
      required: false,
    }),
  },
  async run(context) {
    // `filament/GetFilament` reads filters from $this->POST. compact:true
    // returns a flat list of {id, brand, type, colorName, …} keyed by index;
    // without it we'd get the heavy panel-shape map keyed by id.
    const body: Record<string, unknown> = { compact: true };

    const v = context.propsValue;
    if (v.materialType?.trim()) body['material_type'] = v.materialType.trim();
    if (v.brand?.trim()) body['brand'] = v.brand.trim();
    if (v.color?.trim()) body['color'] = v.color.trim();
    if (v.assigned && v.assigned !== 'any') body['assigned'] = v.assigned === 'true';
    if (v.empty && v.empty !== 'any') body['empty'] = v.empty === 'true';
    if (typeof v.printerId === 'number' && v.printerId > 0) body['pid'] = v.printerId;
    if (v.sortBy) {
      body['sort_by'] = v.sortBy;
      body['sort_dir'] = v.sortDir ?? 'desc';
    }
    if (typeof v.limit === 'number' && v.limit > 0) {
      body['limit'] = Math.min(100, Math.floor(v.limit));
    }

    const res = await simplyprintClient.simplyprintCall<{ filament: Filament[] }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'filament/GetFilament',
      body,
    });
    return res.filament ?? [];
  },
});
