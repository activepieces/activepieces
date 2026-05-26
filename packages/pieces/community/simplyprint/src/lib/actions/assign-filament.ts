import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintFilaments } from '../common/filaments';

export const assignFilamentAction = createAction({
  auth: simplyprintAuth,
  name: 'assign_filament',
  displayName: 'Assign Filament to Printer',
  description:
    'Assign a filament spool to a printer at a specific nozzle + extruder slot. Defaults to nozzle 0 / extruder 0 (single-nozzle single-extruder printers); set the indices for multi-nozzle (e.g. IDEX, toolchanger) or multi-material (MMS, MMU) printers.',
  props: {
    printerId: Property.Number({
      displayName: 'Printer ID',
      description: 'Numeric printer ID. In automation flows this typically flows in from a trigger or upstream step.',
      required: true,
    }),
    filamentId: Property.ShortText({
      displayName: 'Filament',
      description:
        'Numeric spool ID, OR the 4-character short ID (`uid`) printed on the QR sticker / NFC tag.',
      required: true,
    }),
    nozzleIndex: Property.Number({
      displayName: 'Nozzle index',
      description:
        'Which nozzle on the printer (0-based). Use 0 for single-nozzle printers. Multi-nozzle printers (IDEX, toolchanger) use 1+ for the additional nozzles. Backend rejects with "Nozzle out of range" if the printer doesn\'t have this many nozzles.',
      required: false,
      defaultValue: 0,
    }),
    extruderIndex: Property.Number({
      displayName: 'Extruder index',
      description:
        'Which extruder on the chosen nozzle (0-based). Use 0 for single-extruder nozzles. Multi-material setups (MMS, MMU, AMS) use 1+ for the additional extruders feeding the same nozzle. Backend rejects with "Extruder out of range" if the nozzle doesn\'t have this many extruders.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const fid = await simplyprintFilaments.resolveFilamentId(
      context.auth,
      context.propsValue.filamentId,
    );

    const nozzle = Math.max(0, Math.floor(context.propsValue.nozzleIndex ?? 0));
    const extruder = Math.max(0, Math.floor(context.propsValue.extruderIndex ?? 0));

    // Assign.php uses RequirePrinter()/RequireFilaments() which read from
    // GET by default — the printer/spool ids travel as query params.
    // The body uses the new-API shape (`filament` keyed by spool id, with
    // {nozzle, extruder} per spool); the legacy `extruder` shape is also
    // accepted but the new one is the only way to pin a specific nozzle.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'filament/Assign',
      queryParams: {
        pid: String(context.propsValue.printerId),
        fid: String(fid),
      },
      body: {
        filament: {
          [String(fid)]: { nozzle, extruder },
        },
      },
    });
  },
});
