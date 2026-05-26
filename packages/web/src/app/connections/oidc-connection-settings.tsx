import { OIDCProperty } from '@activepieces/pieces-framework';
import React from 'react';

import { GenericPropertiesForm } from '@/app/builder/piece-properties/generic-properties-form';

type OIDCConnectionSettingsProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authProperty: OIDCProperty<any>;
};

const OIDCConnectionSettings = React.memo(
  ({ authProperty }: OIDCConnectionSettingsProps) => {
    return (
      <GenericPropertiesForm
        prefixValue="request.value.props"
        props={authProperty.props}
        useMentionTextInput={false}
        propertySettings={null}
        dynamicPropsInfo={null}
      />
    );
  },
);

OIDCConnectionSettings.displayName = 'OIDCConnectionSettings';
export { OIDCConnectionSettings };
