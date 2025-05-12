import React from 'react';
import { useFormContext } from 'react-hook-form';
import { CodeAction } from '@activepieces/shared';
import { CodeSettingsV1 } from './v1';
import { CodeSettingsV2 } from './v2';


type CodeSettingsProps = {
  readonly: boolean;
};

const CodeSettings = React.memo(({ readonly }: CodeSettingsProps) => {
  const form = useFormContext<CodeAction>();
  const codeVersion = form.watch('settings.version') || 'v1';
  
  if (codeVersion === 'v2') {
    return <CodeSettingsV2 readonly={readonly} />;
  }

  return <CodeSettingsV1 readonly={readonly} />;
});

CodeSettings.displayName = 'CodeSettings';
export { CodeSettings };
