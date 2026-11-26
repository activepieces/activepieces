async function getAccountCredits(apiKey: string) {
  const response = await fetch('https://remove.ac/v1.0/account', {
    headers: { 'X-Api-Key': apiKey },
    redirect: 'error',
  }).catch(() => {
    throw new Error('Could not reach remove.ac to check account credits.');
  });

  if (response.status === 403) {
    throw new Error('Invalid remove.ac API key. Check the key in My Account.');
  }
  if (response.status !== 200) {
    throw new Error(`Could not check remove.ac account credits (HTTP ${response.status}).`);
  }

  const body: AccountResponse = await response.json();
  const credits = body?.data?.attributes?.credits;
  if (typeof credits?.total !== 'number') {
    throw new Error('remove.ac returned an invalid account credit balance.');
  }
  return credits;
}

export const removeAcApi = { getAccountCredits };

type AccountResponse = {
  data?: {
    attributes?: {
      credits?: {
        total: number;
        subscription?: number;
        payg?: number;
        enterprise?: number;
      };
    };
  };
};
