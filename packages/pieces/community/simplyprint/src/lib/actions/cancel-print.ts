import { createPrinterAction } from './factory';

export const cancelPrintAction = createPrinterAction({
  name: 'cancel_print',
  displayName: 'Cancel Print',
  description: 'Cancel the current print on a printer. This is destructive — the job cannot be resumed.',
  path: 'printers/actions/Cancel',
});
