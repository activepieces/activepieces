import { createPrinterAction } from './factory';

export const resumePrintAction = createPrinterAction({
  name: 'resume_print',
  displayName: 'Resume Print',
  description: 'Resume a paused print on a printer.',
  path: 'printers/actions/Resume',
});
