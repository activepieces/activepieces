import { createPrinterAction } from './factory';

export const pausePrintAction = createPrinterAction({
  name: 'pause_print',
  displayName: 'Pause Print',
  description: 'Pause the current print on a printer.',
  path: 'printers/actions/Pause',
});
