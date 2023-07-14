import soap from "soap";
import { Property, createAction } from "@activepieces/pieces-framework";

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
                if (wsdl == null) {
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
        })
    },
    async run (ctx) {
        const { wsdl } = ctx.propsValue;
        
        const client = await soap.createClientAsync(wsdl);
    }
});