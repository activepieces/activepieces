import React from 'react';
    
type CodeSettingsProps = {
  readonly: boolean;
};

const CodeSettingsV2 = React.memo(({ readonly }: CodeSettingsProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        V2 Implementation Coming Soon
      </div>
    </div>
  );
});

CodeSettingsV2.displayName = 'CodeSettingsV2';
export { CodeSettingsV2 }; 