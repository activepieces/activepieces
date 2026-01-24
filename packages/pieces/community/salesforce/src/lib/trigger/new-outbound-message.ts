import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { XMLParser } from 'fast-xml-parser';
import { salesforceAuth } from '../..';

export const newOutboundMessage = createTrigger({
    auth: salesforceAuth,
    name: 'new_outbound_message',
    displayName: 'New Outbound Message',
    description: 'Fires when a new outbound message is received from Salesforce.',
    props: {},
    // See https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_om_outboundmessaging_notification.htm
    sampleData: {
        "soapenv:Envelope": {
            "@_xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
            "@_xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
            "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
            "soapenv:Body": {
                "notifications": {
                    "@_xmlns": "http://soap.sforce.com/2005/09/outbound",
                    "OrganizationId": "00Dxx0000001gEREAY",
                    "ActionId": "04kxx0000000007EAA",
                    "SessionId": "00Dxx0000001gER!AQcAQH0dMHZfz972_fL234234_tL2F0M567657_o.6T4x3O3O2_E_i_j_k_l_m_n_o_p",
                    "EnterpriseUrl": "https://yourInstance.salesforce.com/services/Soap/c/56.0/00Dxx0000001gER",
                    "PartnerUrl": "https://yourInstance.salesforce.com/services/Soap/u/56.0/00Dxx0000001gER",
                    "Notification": {
                        "Id": "04lxx0000000007EAA",
                        "sObject": {
                            "@_xsi:type": "sf:Account",
                            "@_xmlns:sf": "urn:sobject.enterprise.soap.sforce.com",
                            "Id": "001xx000003D8i1AAC",
                            "Name": "New Account From Webhook"
                        }
                    }
                }
            }
        }
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable() {
        // Webhook triggers don't require setup
    },
    async onDisable() {
        // Webhook triggers don't require cleanup
    },
    async run(context) {
        const requestBody = context.payload.body as string;

        const parser = new XMLParser({
            attributeNamePrefix: "@_",
            textNodeName: "#text",
            ignoreAttributes: false,
            parseTagValue: true,
            parseAttributeValue: true,
            trimValues: true,
            isArray: (name) => {
                return name === "Notification";
            }
        });
        
        const parsedData = parser.parse(requestBody);

        const notifications = parsedData?.['soapenv:Envelope']?.['soapenv:Body']?.['notifications']?.['Notification'] || [];


        return [notifications];
    },
});