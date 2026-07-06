import { OIDCAuthProps, OIDCProperty } from '@activepieces/pieces-framework';
import React from 'react';

import { GenericPropertiesForm } from '@/app/builder/piece-properties/generic-properties-form';

type OIDCConnectionSettingsProps = {
  authProperty: OIDCProperty<OIDCAuthProps>;
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
