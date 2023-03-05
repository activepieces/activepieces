import { createAction } from "@activepieces/framework";
import { GmailRequests } from "../common/data";
import { GmailLabel } from "../common/models";
import { GmailProps } from "../common/props";

export const gmailSearchMail = createAction({
  name: 'gmail_search_mail',
  description: 'Search for an email in your Gmail account',
  displayName: 'Search Email',
  props: {
    authentication: GmailProps.authentication,
    subject: GmailProps.subject(true),
    from: GmailProps.from(),
    to: GmailProps.to(),
    label: GmailProps.label(),
    category: GmailProps.category()
  },
  sampleData: {},
  async run({ propsValue: { authentication, from, to, subject, label, category } }) {
    
    const response = await GmailRequests.searchMail({
      access_token: (authentication.access_token as string), 
      from: from as string, 
      to: to as string, 
      subject: subject as string, 
      label: label as GmailLabel, 
      category: category as string
    })

    return [response.body]
  }
})