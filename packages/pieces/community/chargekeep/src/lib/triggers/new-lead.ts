import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../..';
import { chargekeepCommon } from '../common/common';

export const newLead = createTrigger({
  auth: chargekeepAuth,
  name: 'new_lead',
  displayName: 'New Lead',
  description: 'Triggers when a new lead is created',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 100500,
    group: 'P',
    personalInfo: {
      fullName: {
        namePrefix: 'Mr',
        firstName: 'John',
        middleName: 'G',
        lastName: 'Smith',
        nameSuffix: 'Jr',
        nickName: 'Johnny',
      },
      doB: '1992-06-30T00:00:00Z',
      mobilePhone: '+12057899877',
      mobilePhoneExt: '123',
      homePhone: '+12057985632',
      homePhoneExt: '123',
      phone1: null,
      phoneExt1: null,
      phone2: null,
      phoneExt2: null,
      preferredToD: 'Anytime',
      timeZone: 'Pacific Standard Time',
      ssn: '123456456',
      bankCode: 'BANK',
      email1: 'personalemail1@gmal.com',
      email2: 'personalemail2@hotmail.com',
      email3: 'personalemail3@yahoo.com',
      email4: null,
      email5: null,
      drivingLicense: 'ASDF4566G',
      drivingLicenseState: 'NY',
      isActiveMilitaryDuty: true,
      gender: 'Male',
      fullAddress: {
        street: '999-901 Emancipation Ave',
        addressLine2: null,
        neighborhood: null,
        city: 'Houston',
        stateName: 'Texas',
        stateId: 'TX',
        zip: '77003',
        countryName: 'United States of America',
        countryId: 'US',
        startDate: '2018-04-30T00:00:00Z',
        isOwner: true,
      },
      fullAddress2: null,
      fullAddress3: null,
      isUSCitizen: true,
      webSiteUrl: 'www.myprofile.com',
      facebookUrl: 'www.fb.com/j.smith',
      linkedInUrl: 'https://www.linkedin.com/j.smith',
      instagramUrl: 'https://www.instagram.com/j.smith',
      twitterUrl: 'https://twitter.com/j.smith',
      googlePlusUrl: 'https://googleplus.com/j.smith',
      angelListUrl: 'https://angel.co/',
      zoomUrl: 'https://zoom.com',
      otherLinkUrl: 'https://otherlink.com',
      photoUrl: 'https://www.myprofile.com/profile-pictures/myphoto.png',
      experience:
        'Improvements made to two existing products, designed five completely new products for four customers.',
      profileSummary:
        'Highly skilled and results-oriented professional with solid academic preparation holding a Juris Doctor degree and extensive experience in intelligence and special operations seeks position in risk management.',
      interests: ['World Economy', 'Baseball'],
      affiliateCode: 'PA001',
      isActive: null,
      customFields: {
        customField1: null,
        customField2: null,
        customField3: null,
        customField4: null,
        customField5: null,
      },
    },
    businessInfo: {
      companyName: 'MyCompany LLC',
      organizationType: 'Inc',
      jobTitle: 'Chief Executive Officer',
      isEmployed: true,
      employmentStartDate: '2021-12-30T00:00:00Z',
      employeeCount: 500,
      dateFounded: '2021-06-30T00:00:00Z',
      ein: '35-8896524',
      annualRevenue: 6000000.0,
      industry: 'Sport and Entertainment',
      companyPhone: '+12057784563',
      companyPhoneExt: '123',
      companyFaxNumber: '+12057324598',
      companyEmail: 'companyemail1@company.com',
      companyFullAddress: {
        street: '1500 Canton st',
        addressLine2: null,
        neighborhood: null,
        city: 'Dallas',
        stateName: 'Texas',
        stateId: 'TX',
        zip: '75201',
        countryName: 'United States of America',
        countryId: 'US',
        startDate: '2018-04-30T00:00:00Z',
        isOwner: false,
      },
      companyWebSiteUrl: 'www.mycompany.com',
      companyFacebookUrl: 'www.fb.com/mycompany',
      companyLinkedInUrl: 'https://www.linkedin.com/mycompany',
      companyInstagramUrl: 'https://www.instagram.com/mycompany',
      companyTwitterUrl: 'https://twitter.com/mycompany',
      companyGooglePlusUrl: 'https://googleplus.com/mycompany',
      companyCrunchbaseUrl: 'https://www.crunchbase.com/mycompany',
      companyBBBUrl: 'https://www.bbb.org/en/us/overview-of-bbb-ratings',
      companyPinterestUrl: 'https://www.pinterest.com/mycompany',
      companyDomainUrl: 'https://www.domain.com/mycompany',
      companyAlexaUrl: 'https://www.alexa.com/mycompany',
      companyOpenCorporatesUrl: 'https://www.opencorporates.com/mycompany',
      companyGlassDoorUrl: 'https://www.classdoor.com/mycompany',
      companyTrustpilotUrl: 'https://www.trustpilot.com/mycompany',
      companyFollowersUrl: 'https://www.followers.com/mycompany',
      companyYoutubeUrl: 'https://www.youtube.com/mycompany',
      companyYelpUrl: 'https://www.yelp.com/mycompany',
      companyRSSUrl: 'https://www.rss.com/mycompany',
      companyNavUrl: 'https://www.nav.com/mycompany',
      companyAngelListUrl: 'https://www.angelist.com/mycompany',
      companyCalendlyUrl: 'https://www.calendly.com/mycompany',
      companyZoomUrl: 'https://zoom.com/mycompany',
      companyOtherLinkUrl: 'https://www.otherlink.com/mycompany',
      companyLogoUrl: 'https://www.mycompany.com/images/companylogo/logo.png',
      workPhone1: '+12057412354',
      workPhone1Ext: '123',
      workPhone2: '+12057741236',
      workPhone2Ext: '123',
      workEmail1: 'workemail1@company.com',
      workEmail2: 'workemail2@company.com',
      workEmail3: 'workemail3@company.com',
      workFullAddress: {
        street: '1502-1702 Strawberry Rd',
        addressLine2: null,
        neighborhood: null,
        city: 'Pasadena',
        stateName: 'Texas',
        stateId: 'TX',
        zip: '77502',
        countryName: 'United States of America',
        countryId: 'US',
        startDate: '2020-05-30T00:00:00Z',
        isOwner: false,
      },
      affiliateCode: 'CA0001',
    },
    dateCreated: '2022-06-23T13:32:54.9451405Z',
    ipAddress: '192.168.0.1',
    trackingInfo: {
      sourceCode: 'Code',
      channelCode: 'ChannelCode',
      affiliateCode: '414CODE',
      refererUrl: 'http://www.refererurl.com/referpage.html',
      entryUrl: 'https://entryurl.com/start-now/?ref=wow',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
      clientIp: '192.168.0.1',
    },
    applicationInfo: {
      applicationId: '771XYZ23234G',
      applicantId: '771XYZSD',
      applicantUserId: 10229,
      clickId: '2B69283E-9433-4CE6-A24E-D8809C050B70',
      requestedLoanAmount: 89.0,
      incomeType: 'Benefits',
      netMonthlyIncome: 899.0,
      payFrequency: 'Monthly',
      payNextDate: '2022-07-30T13:32:54.945358Z',
      bankName: 'Bank Name',
      bankAccountType: 'Checking',
      monthsAtBank: 24,
      bankAccountNumber: '26005325777412',
      creditScoreRating: 'Excellent',
      loanReason: 'AutoPurchase',
      creditCardDebtAmount: 56898.0,
    },
    classificationInfo: {
      rating: '10',
      lists: ['My List 1', 'My List 2', 'My List 3'],
      tags: ['My Tag 1', 'My Tag 2', 'My Tag 3'],
      partnerTypeName: 'My Partner Type',
    },
    eventTime: '2022-06-30T13:32:54Z',
  },

  async onEnable(context) {
    const webhookId = await chargekeepCommon.subscribeWebhook(
      'LeadCreated',
      context.auth.base_url,
      context.auth.api_key,
      context.webhookUrl
    );

    await context.store?.put<WebhookInformation>('_new_lead_trigger', {
      webhookId: webhookId,
    });
  },

  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_new_lead_trigger'
    );

    if (response !== null && response !== undefined) {
      await chargekeepCommon.unsubscribeWebhook(
        context.auth.base_url,
        context.auth.api_key,
        response.webhookId
      );
    }
  },

  async run(context) {
    return [context.payload.body];
  },
});

interface WebhookInformation {
  webhookId: number;
}
