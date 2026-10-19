import { FlowVersionTemplate } from '@activepieces/shared';

import { templateUtils } from '@/features/flows';

export function readTemplateFile({
  file,
  onChange,
  onInvalid,
}: {
  file: File | undefined;
  onChange: (template: FlowVersionTemplate | undefined) => void;
  onInvalid: () => void;
}): void {
  if (file === undefined) {
    onChange(undefined);
    return;
  }
  const reject = () => {
    onChange(undefined);
    onInvalid();
  };
  file
    .text()
    .then((text) => {
      const flowTemplate = templateUtils.extractFlow(text);
      if (flowTemplate) {
        onChange(flowTemplate);
        return;
      }
      reject();
    })
    .catch(reject);
}
