import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const createPayment = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'create_payment',
    displayName: 'Create Payment',
    description: 'Creates a new manual payment in Oracle Fusion Cloud ERP.',
    props: {
        businessUnit: Property.ShortText({
            displayName: 'Business Unit',
            description: 'The business unit name for the payment.',
            required: true,
        }),
        paymentNumber: Property.Number({
            displayName: 'Payment Number',
            description: 'The check number printed on physical check.',
            required: true,
        }),
        paymentDate: Property.ShortText({
            displayName: 'Payment Date',
            description: 'The date when the payment is made (YYYY-MM-DD).',
            required: true,
        }),
        paymentCurrency: Property.ShortText({
            displayName: 'Payment Currency',
            description: 'The currency in which payment is made (e.g., USD).',
            required: true,
            defaultValue: 'USD',
        }),
        paymentMethodCode: Property.ShortText({
            displayName: 'Payment Method Code',
            description: 'The payment method code (e.g., CHECK, EFT).',
            required: true,
        }),
        payee: Property.ShortText({
            displayName: 'Payee',
            description: 'The party name to whom payment is made.',
            required: false,
        }),
        payeeSite: Property.ShortText({
            displayName: 'Payee Site',
            description: 'The supplier site name to whom payment is made.',
            required: false,
        }),
        paymentProcessProfile: Property.ShortText({
            displayName: 'Payment Process Profile',
            description: 'The payment process profile name.',
            required: false,
        }),
        paymentDocument: Property.ShortText({
            displayName: 'Payment Document',
            description: 'The name of the payment document.',
            required: false,
        }),
        paymentDescription: Property.LongText({
            displayName: 'Payment Description',
            description: 'The user description for the payment.',
            required: false,
        }),
        disbursementBankAccountName: Property.ShortText({
            displayName: 'Disbursement Bank Account',
            description: 'The name of the internal bank account from where the payment is made.',
            required: false,
        }),
        remitToAccountNumber: Property.ShortText({
            displayName: 'Remit-to Account Number',
            description: "The supplier's bank account number for electronic payment.",
            required: false,
        }),
        conversionRateType: Property.ShortText({
            displayName: 'Conversion Rate Type',
            description: 'The type of conversion rate used for foreign currency payments.',
            required: false,
        }),
        conversionRate: Property.Number({
            displayName: 'Conversion Rate',
            description: 'The conversion rate for foreign currency payments.',
            required: false,
        }),
        addressLine1: Property.ShortText({
            displayName: 'Address Line 1',
            description: 'The first address line of party to whom the payment is made.',
            required: false,
        }),
        city: Property.ShortText({
            displayName: 'City',
            description: 'The city name of the party to whom the payment is made.',
            required: false,
        }),
        state: Property.ShortText({
            displayName: 'State',
            description: 'The state name of the party to whom the payment is made.',
            required: false,
        }),
        country: Property.ShortText({
            displayName: 'Country',
            description: 'The country name of the party to whom the payment is made.',
            required: false,
        }),
        zip: Property.ShortText({
            displayName: 'Postal Code',
            description: 'The postal code of the party to whom the payment is made.',
            required: false,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const {
            businessUnit,
            paymentNumber,
            paymentDate,
            paymentCurrency,
            paymentMethodCode,
            payee,
            payeeSite,
            paymentProcessProfile,
            paymentDocument,
            paymentDescription,
            disbursementBankAccountName,
            remitToAccountNumber,
            conversionRateType,
            conversionRate,
            addressLine1,
            city,
            state,
            country,
            zip,
        } = context.propsValue;

        const payload: Record<string, unknown> = {
            BusinessUnit: businessUnit,
            PaymentNumber: paymentNumber,
            PaymentDate: paymentDate,
            PaymentCurrency: paymentCurrency,
            PaymentMethodCode: paymentMethodCode,
        };

        if (payee) payload['Payee'] = payee;
        if (payeeSite) payload['PayeeSite'] = payeeSite;
        if (paymentProcessProfile) payload['PaymentProcessProfile'] = paymentProcessProfile;
        if (paymentDocument) payload['PaymentDocument'] = paymentDocument;
        if (paymentDescription) payload['PaymentDescription'] = paymentDescription;
        if (disbursementBankAccountName) payload['DisbursementBankAccountName'] = disbursementBankAccountName;
        if (remitToAccountNumber) payload['RemitToAccountNumber'] = remitToAccountNumber;
        if (conversionRateType) payload['ConversionRateType'] = conversionRateType;
        if (conversionRate) payload['ConversionRate'] = conversionRate;
        if (addressLine1) payload['AddressLine1'] = addressLine1;
        if (city) payload['City'] = city;
        if (state) payload['State'] = state;
        if (country) payload['Country'] = country;
        if (zip) payload['Zip'] = zip;

        const response = await client.createRecord('/payablesPayments', payload);
        return response;
    },
});
