interface Growsumo {
  data: {
    email: string;
    name: string;
    customer_key: string;
  };
  createSignup: () => void;
}

declare global {
  interface Window {
    growsumo: Growsumo;
  }
}

export const usePartnerStack = () => {
  const reportSignup = (email: string, firstName: string) => {
    window.growsumo.data.email = email;
    window.growsumo.data.name = firstName;
    window.growsumo.data.customer_key = `ps_cus_key_${email}`;
    window.growsumo.createSignup();
  };

  return { reportSignup };
};