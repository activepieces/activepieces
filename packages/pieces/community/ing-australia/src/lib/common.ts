import { launch } from 'puppeteer';
import { login } from 'ing-au-login';

import axios from 'axios';
import qs from 'qs';
import moment from 'moment';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function retrieveAuthToken(context: any) {
    // Log into the ING web portal, using the browser.
    let authToken = "";
    const browser = await launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    try {
      // TODO: Handle cases where ING locks a user out, and requests that they reset
      // their PIN code. Return error message telling a user what to do.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          authToken = await login(
            page,
            context.auth.username,
            context.auth.password
          );
          console.log(authToken);
          break;
        } catch (e) {
          const message = (e as Error).message
          console.log(message);
        }
      }
    } finally {
      await page.close();
      await browser.close();
    }

    return authToken;
}

export async function fetchTransactions(
    authToken: string,
    accountNumber: string,
    downloadFormat: string,
    searchQuery: string,
    periodInDays: number,
    minAmount: number | string,
    maxAmount: number | string,
    transactionType: number | string
) {
    const url =
      'https://www.ing.com.au/api/ExportTransactions/Service/ExportTransactionsService.svc/json/ExportTransactions/ExportTransactions'
    const data = {
      'X-AuthToken': authToken,
      AccountNumber: accountNumber,
      Format: downloadFormat,
      FilterStartDate: moment()
        .subtract(periodInDays, 'days')
        .format('YYYY-MM-DDTHH:mm:ssZZ'),
      FilterEndDate: moment()
        .format('YYYY-MM-DDTHH:mmssZZ'),
      FilterMinValue: minAmount,
      FilterMaxValue: maxAmount,
      FilterProductTransactionTypeId: transactionType,
      SearchQuery: searchQuery,
      IsSpecific: 'false',
    }
    const response = await axios.post(url, qs.stringify(data));
    return response.data;
}
