import React, { useEffect } from 'react';
import { ControllerRenderProps } from 'react-hook-form';

import { Button } from '@/components/ui/button';

const tryParseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

interface BuilderJsonEditorWrapperProps {
  field: ControllerRenderProps<Record<string, any>, string>;
  disabled?: boolean;
  property: any;
}

const ExternalPieceProperty = React.memo(
  (props: BuilderJsonEditorWrapperProps) => {
    useEffect(() => {
      const handler = (event) => {
        console.log('event', event.data);
        if (event.data.type === 'EXTERNAL_DATA_RESPONSE') {
          props.field.onChange(tryParseJson(event.data.data));
        }
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, [props.field]);

    return (
      <>
        <Button
          variant="default"
          className="center-items"
          onClick={(e) => {
            e.preventDefault();
            const requestId = Math.round(Math.random() * 10 ** 10);
            window.parent.postMessage(
              {
                data: { dataType: 'INVOICE_FILTERS', requestId },
                type: 'EXTERNAL_DATA_REQUEST',
              },
              '*'
            );
          }}
        >
          <span>Select Data</span>
        </Button>
        <div>
          <label>Current Data:</label>
          <div>{JSON.stringify(props.field.value)}</div>
        </div>
      </>
    );
  }
);

ExternalPieceProperty.displayName = 'ExternalPieceProperty';
export { ExternalPieceProperty };
