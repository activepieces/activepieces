export interface Transaction {
  id?: string;
  account?: string;
  date: string;
  amount?: number;
  payee?: string;
  payee_name?: string; // Only available in a create request
  imported_payee?: string;
  category?: string;
  notes?: string;
  imported_id?: string;
  transfer_id?: string;
  cleared?: boolean;
}

