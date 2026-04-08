import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const createPreHire = createAction({
	auth: workdayAuth,
	name: 'create_pre_hire',
	displayName: 'Create Pre-Hire',
	description: 'Creates a new pre-hire record in Workday.',
	props: {
		firstName: Property.ShortText({
			displayName: 'First Name',
			description: 'Legal first name of the pre-hire.',
			required: true,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			description: 'Legal last name of the pre-hire.',
			required: true,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Email address (at least one of email, phone, or address is required).',
			required: true,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Phone number.',
			required: false,
		}),
		dateOfBirth: Property.ShortText({
			displayName: 'Date of Birth',
			description: 'Date of birth (YYYY-MM-DD).',
			required: false,
		}),
		country: Property.ShortText({
			displayName: 'Country',
			description: 'ISO 3166-1 Alpha-3 country code (e.g., "USA", "GBR", "DEU"). Required by Workday.',
			required: true,
			defaultValue: 'USA',
		}),
	},
	async run(ctx) {
		const { firstName, lastName, email, phone, country } = ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		let phoneXml = '';
		if (phone) {
			phoneXml = `
            <bsvc:Phone_Data>
              <bsvc:Phone_Number>${escapeXml(phone)}</bsvc:Phone_Number>
              <bsvc:Phone_Device_Type_Reference>
                <bsvc:ID bsvc:type="Phone_Device_Type_ID">Mobile</bsvc:ID>
              </bsvc:Phone_Device_Type_Reference>
              <bsvc:Usage_Data bsvc:Public="true">
                <bsvc:Type_Data bsvc:Primary="true">
                  <bsvc:Type_Reference>
                    <bsvc:ID bsvc:type="Communication_Usage_Type_ID">WORK</bsvc:ID>
                  </bsvc:Type_Reference>
                </bsvc:Type_Data>
              </bsvc:Usage_Data>
            </bsvc:Phone_Data>`;
		}

		const operationXml = `
    <bsvc:Put_Applicant_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Applicant_Data>
        <bsvc:Personal_Data>
          <bsvc:Name_Data>
            <bsvc:Legal_Name_Data>
              <bsvc:Name_Detail_Data>
                <bsvc:Country_Reference>
                  <bsvc:ID bsvc:type="ISO_3166-1_Alpha-3_Code">${escapeXml(country)}</bsvc:ID>
                </bsvc:Country_Reference>
                <bsvc:First_Name>${escapeXml(firstName)}</bsvc:First_Name>
                <bsvc:Last_Name>${escapeXml(lastName)}</bsvc:Last_Name>
              </bsvc:Name_Detail_Data>
            </bsvc:Legal_Name_Data>
          </bsvc:Name_Data>
          <bsvc:Contact_Data>
            <bsvc:Email_Address_Data>
              <bsvc:Email_Address>${escapeXml(email)}</bsvc:Email_Address>
              <bsvc:Usage_Data bsvc:Public="true">
                <bsvc:Type_Data bsvc:Primary="true">
                  <bsvc:Type_Reference>
                    <bsvc:ID bsvc:type="Communication_Usage_Type_ID">WORK</bsvc:ID>
                  </bsvc:Type_Reference>
                </bsvc:Type_Data>
              </bsvc:Usage_Data>
            </bsvc:Email_Address_Data>${phoneXml}
          </bsvc:Contact_Data>
        </bsvc:Personal_Data>
      </bsvc:Applicant_Data>
    </bsvc:Put_Applicant_Request>`;

		return workdaySoapRequest(
			ctx.auth as OAuth2PropertyValue,
			'Staffing',
			operationXml,
		);
	},
});
