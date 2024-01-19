import * as soap from 'soap';
import {
  CustomAuthProps,
  Property,
  ShortTextProperty,
  StaticDropdownProperty,
  StaticMultiSelectDropdownProperty,
  StaticPropsValue,
  createAction,
} from '@activepieces/pieces-framework';
import { soapAuth } from '../shared/auth';

type DynamicProp =
  | ShortTextProperty<boolean>
  | StaticDropdownProperty<any, boolean>
  | StaticMultiSelectDropdownProperty<any, boolean>;

export const callMethod = createAction({
  name: 'call_method',
  displayName: 'Call SOAP Method',
  description: 'Call a SOAP from a given wsdl specification',
  auth: soapAuth(),
  props: {
    wsdl: Property.ShortText({
      displayName: 'WSDL URL',
      required: true,
    }),
    method: Property.Dropdown({
      description: 'The SOAP Method',
      displayName: 'Method',
      required: true,
      refreshers: ['wsdl'],
      options: async ({ wsdl }) => {
        if (!wsdl) {
          return {
            disabled: true,
            placeholder: 'Setup WSDL URL first',
            options: [],
          };
        }

        const client = await soap.createClientAsync(wsdl as string);
        const spec = client.describe();
        const methods = Object.keys(
          Object.values(Object.values(spec)[0] as object)[0]
        );

        return {
          disabled: false,
          options: methods.map((method) => {
            return {
              label: method,
              value: method,
            };
          }),
        };
      },
    }),
    args: Property.DynamicProperties({
      description: 'Arguments for the SOAP method',
      displayName: 'Parameters',
      required: true,
      refreshers: ['wsdl', 'method'],
      async props({ wsdl, method }) {
        if (!wsdl || !method) {
          return {};
        }
        const client = await soap.createClientAsync(wsdl as unknown as string);
        const spec = client.describe();
        const methods = Object.values(Object.values(spec)[0] as object)[0];

        const properties: Record<string, DynamicProp> = {};

        for (const key in methods[method as unknown as string]['input']) {
          properties[key as string] = Property.ShortText({
            displayName: key,
            required: true,
          });
        }

        return properties;
      },
    }),
    parsed: Property.Checkbox({
      displayName: 'Parsed',
      required: false,
      defaultValue: false,
    }),
  },
  async run(ctx) {
    const { wsdl, method, args, parsed } = ctx.propsValue;

    const client = await soap.createClientAsync(wsdl, {
      forceSoap12Headers: true,
    });

    const auth = ctx.auth as StaticPropsValue<CustomAuthProps>;
    switch (auth['type']) {
      case 'WS':
        client.setSecurity(
          new soap.WSSecurity(
            auth['username'] as string,
            auth['password'] as string
          )
        );
        break;
      case 'Basic':
        client.setSecurity(
          new soap.BasicAuthSecurity(
            auth['username'] as string,
            auth['password'] as string
          )
        );
        break;
      case 'Header': // eslint-disable-next-line no-case-declarations
        client.addSoapHeader(ctx.auth['customHeader'] as string);
        break;
    }

    const action = client[method + 'Async'];

    try {
      const [actionRes] = await action(args);

      if (parsed || false) {
        return actionRes;
      } else {
        return {
          request: client.lastRequest,
          response: client.lastResponse,
        };
      }
    } catch (e: any) {
      return {
        error: true,
        status: e.response.status,
        raw: {
          request: client.lastRequest,
          response: e.body,
        },
      };
    }
  },
});
