
export type RazorpayCredentials = {
    keyID: string;
    keySecret: string;
};
  
  export const generateRazorpayAuthHeader = (credentials: RazorpayCredentials) => {
    const { keyID, keySecret } = credentials;
    const encodedCredentials = Buffer.from(`${keyID}:${keySecret}`).toString('base64');
    return {
      Authorization: `Basic ${encodedCredentials}`,
    };
  };


  export const razorpayURL = {
    apiURL: 'https://api.razorpay.com/v1/'
  };