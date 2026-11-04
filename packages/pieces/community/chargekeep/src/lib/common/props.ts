export const CURRENCY_OPTIONS = ['USD', 'JPY', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD'].map((c) => ({ label: c, value: c }));

export const UNIT_OPTIONS = ['Unit', 'Day', 'Month', 'Year', 'Hour', 'Kilogram', 'Zone', 'Package', 'Pound', 'Piece', 'Feet', 'Custom'].map((u) => ({ label: u, value: u }));

export const PAYMENT_PERIOD_OPTIONS = ['Monthly', 'Annual', 'LifeTime', 'OneTime', 'Custom'].map((p) => ({ label: p, value: p }));
