import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

const MAX_GCODE_LINES = 200;

export const sendGcodeAction = createAction({
  auth: simplyprintAuth,
  name: 'send_gcode',
  displayName: 'Send G-code',
  description: 'Send raw G-code commands to an operational printer (requires Print Farm plan).',
  audience: 'both',
  aiMetadata: {
    description:
      'Send raw G-code commands (one per line, up to 200 lines) to an operational printer by ID. Pick this for low-level printer control — homing, temperature, movement, custom macros — when no higher-level action exists. Not idempotent: commands execute on the physical printer each time, so re-running repeats the motion/heating. Requires the Print Farm plan.',
    idempotent: false,
  },
  props: {
    printerId: Property.Number({
      displayName: 'Printer ID',
      description: 'Numeric printer ID. Typically piped in from an upstream step.',
      required: true,
    }),
    gcode: Property.LongText({
      displayName: 'G-code',
      description: `One G-code command per line, e.g. "G28" then "M104 S200". Up to ${MAX_GCODE_LINES} lines per request.`,
      required: true,
    }),
  },
  async run(context) {
    const raw = (context.propsValue.gcode ?? '') as string;
    const gcode = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (gcode.length === 0) throw new Error('Provide at least one G-code line.');
    if (gcode.length > MAX_GCODE_LINES) {
      throw new Error(`Up to ${MAX_GCODE_LINES} G-code lines per request.`);
    }

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'printers/actions/SendGcode',
      queryParams: { pid: String(context.propsValue.printerId) },
      body: { gcode },
    });
  },
});
