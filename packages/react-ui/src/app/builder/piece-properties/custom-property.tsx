import { CustomProperty as CustomPropertyType } from '@activepieces/pieces-framework';
import { useEffect, useId } from 'react';

import { projectHooks } from '@/hooks/project-hooks';
const CUSTOM_PROPERTY_CONTAINER_ID = 'custom-property-container';

type CustomPropertyParams = {
  value: unknown;
  onChange: (value: unknown) => void;
  code: string;
  disabled: boolean;
  property: CustomPropertyType<boolean>;
};

const parseFunctionString = (code: string) => {
  return new Function(
    'params',
    `
    return (${code})(params);
  `,
  );
};
const CustomProperty = ({
  value,
  onChange,
  code,
  disabled,
  property,
}: CustomPropertyParams) => {
  const { project } = projectHooks.useCurrentProject();
  const id = useId();
  const containerId = CUSTOM_PROPERTY_CONTAINER_ID + '-' + id;
  useEffect(() => {
    try {
      const params = {
        containerId,
        value,
        onChange,
        projectId: project.id,
        disabled,
        property,
      };
      // Create function that takes a params object
      const fn = parseFunctionString(code);
      // Execute the function with args as the params object
      const cleanUpFunction = fn(params);
      if (cleanUpFunction && typeof cleanUpFunction === 'function') {
        return cleanUpFunction;
      }
    } catch (error) {
      console.error('Error executing custom code:', error);
    }
  }, []);
  return <div id={containerId}></div>;
};

CustomProperty.displayName = 'CustomProperty';
export default CustomProperty;
