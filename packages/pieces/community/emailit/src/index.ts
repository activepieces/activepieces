import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendEmail } from './lib/actions/send-email';

const markdownDescription = `
# EmailIt

Send transactional emails using the EmailIt API service.

## Features
- Send HTML emails
- Customizable sender name and email
- Simple API key authentication

## Setup
1. Get your API key from [EmailIt Credentials](https://app.emailit.com)
2. Enter your API key when configuring this piece
3. Start sending emails!
`;

export const emailitAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your EmailIt API key from https://app.emailit.com',
  required: true,
});

export const emailit = createPiece({
  displayName: 'EmailIt',
  description: 'Send transactional emails with EmailIt',
  auth: emailitAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAtCAYAAAAOYyOGAAADpklEQVR4AdyYb3LaMBDFV6JHaDr9VnORFg5SArfolDT8aej0FpDkICa5iN1vnaZXwOp7MjLGxuCEpEH2sMiWVtL7aVcyg5aq60s/kIveOLPh+VysfQ5l6KwXybBkBnWPtR3juDlYurlRUtPXz3256HeqpJeh2GHYM9JKIjEyEmdi+mJNYTBnEohI0eQJV3EMPLs5WLq5UVKPUnMxCRa3F9lFL0y4DcUIsEPB6YQfA7vo1M3MWgvdQLFBuCrrFq8K6G6ZkZOcQjHlvAVyKEhN7jc8plBKZZSo8/dj5JziU6h0s/PZd8OJ3e9osannO0tOf7IKtGiF4zNX6fsteLQY9cF3jqJ+t6eK9f4+I0jNg5IEewpf/oZlt/IGRkoEUKpZp58opp807kKkGsfE9GsalIm1rHRXlEyAFsN8/sRCjtltV8vPRSxXN2MLZ8xAxCz3kZ1g2xrmpm05IHCzpwj343YhIAVg21LD4WQ/jMpKt2W2gXFa9ftwXD7SCZhGz8HFrsMrl7Fd7NmNslGhzoIg8uiV1uHZcjp/G37HHyoFD3ZK4bryuqnpYNoWpiCTj4QhB3gipl8A+r7SJjy7m0bv7iZjOm0Z4cqpGW/5PP9DDF0TuxV2pJibjnqpmzDwxz9eUjrSAyNqRCc6k951zkoCbkVPLbK2429SEGaFA+F8hXGpi/qg01AvmgNY9mGksofcjYUDfciQVqamjd71wK4mhciTAMsgHDcnxt06GOiK1jCuaausgnJOAUO6NzXpydWkkBkAuYl5KllIg9cDjU6Zxfa1wdNL6W52erF/5rK5cSCISnQIxvU6BOX8WNrocXBG7+x+avOXDSXLIG8hmobTirCptYWvDabw1QLQpd62gtnBFMuBBLahxhehsHI1PDcuAaMnRua1ADf9Dt7lomKYHQb7+2CnHQ6E2lFdu2onIFe5zggZxP00xAKZXFTqdK/ywW+/qqbH12eAXGWIjJCiIVOVaYT7Pksa7kO0byCMlN+R8vTr2EjtmzlAinaYqjaNkK4sabZ+X88j2zQmfeyeOnLKF+6u5FnT74XV1h9e13f1xDNhpPDlidzaMrVS5ldtb08cG5d+DJJOEl35U+VZAvOfBzFKxfqNrBp1pLdWyVL/7o5jvKsaEy3yaEmv67Tw+9skqksCC/Xw8XKBny4LVnhrSpZ/u99sxlkogrRMMlFiJrz3zowsEBgbJWrPoJiLfz6NxthfA5glpsOJW8yUe+hcDvI6/wEAAP//U+7YSQAAAAZJREFUAwB6gNr3C9t6PAAAAABJRU5ErkJggg==',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['dennisklappe'],
  actions: [sendEmail],
  triggers: [],
});