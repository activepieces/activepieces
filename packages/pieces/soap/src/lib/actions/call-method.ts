import * as soap from "soap";
import { Property, ShortTextProperty, StaticDropdownProperty, StaticMultiSelectDropdownProperty, createAction } from "@activepieces/pieces-framework";


type DynamicProp = ShortTextProperty<boolean> | StaticDropdownProperty<any, boolean> | StaticMultiSelectDropdownProperty<any,boolean>;

export const callMethod = createAction({
    name: 'call_method',
    displayName: 'Call SOAP Method',
    description: 'Call a SOAP from a given wsdl specification',
    props: {
        wsdl: Property.ShortText({
            displayName: 'WSDL URL',
            required: true
        }),
        method: Property.Dropdown({
            description: 'The SOAP Method',
            displayName: 'Method',
            required: true,
            refreshers: ['wsdl'],
            options: async ({wsdl}) => {
                if (!wsdl) {
                    return {
                        disabled: true,
                        placeholder: 'Setup WSDL URL first',
                        options: []
                    };
                }
                
                const client = await soap.createClientAsync(wsdl as string);
                const spec = client.describe();
                const methods = Object.keys(Object.values(Object.values(spec)[0] as object)[0]);

                return {
                    disabled: false,
                    options: methods.map(method => {
                        return {
                            label: method,
                            value: method
                        }
                    })
                }
            }
        }),
        args: Property.DynamicProperties({
            description: 'Arguments for the SOAP method',
            displayName: 'Parameters',
            required: true,
            refreshers: ['wsdl', 'method'],
            async props({wsdl, method}) {
                if (!wsdl || !method) {
                    return {};
                }
                const client = await soap.createClientAsync(wsdl as unknown as string);
                const spec = client.describe();
                const methods = Object.values(Object.values(spec)[0] as object)[0];

                const properties: Record<string, DynamicProp > = {};

                for (const key in methods[method as unknown as string]['input']) {
                    properties[key as string] = Property.ShortText({
                        displayName: key,
                        required: true
                    });
                }

                return properties;
            }
        })
    },
    async run (ctx) {
        const { wsdl, method, args } = ctx.propsValue;
        
        const client = await soap.createClientAsync(wsdl);
        
        return await client[method + 'Async'](args);
    }
});