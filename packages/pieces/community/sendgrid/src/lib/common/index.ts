export const sendgridCommon = {
  baseUrl: (residency = 'US'): string => {
    const urls: { [key: string]: string } = {
      'US': 'https://api.sendgrid.com/v3',
      'EU': 'https://api.eu.sendgrid.com/v3',
    };

    // Return the base URL based on the residency, defaulting to 'US'
    return urls[residency] || urls['US'];
  }
};
