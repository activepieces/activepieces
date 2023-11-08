export interface YnabBudget {
  id: string;
  name: string;
}

export interface YnabCategory {
  id: string;
  name: string;
  hidden: boolean;
  budgeted: number;
  activity: number;
  balance: number;
  deleted: boolean;
}

export interface YnabCategoryGroup {
  id: string;
  name: string;
  hidden: boolean;
  deleted: boolean;
}

export type YnabCategoryGroupWithCategories = YnabCategoryGroup & {
  categories: YnabCategory[];
};

export type YnabAccountType =
  | 'checking'
  | 'savings'
  | 'cash'
  | 'creditCard'
  | 'lineOfCredit'
  | 'otherAsset'
  | 'otherLiability'
  | 'mortgage'
  | 'autoLoan'
  | 'studentLoan'
  | 'personalLoan'
  | 'medicalDebt'
  | 'otherDebt';

export interface YnabAccount {
  id: string;
  name: string;
  type: YnabAccountType;
  closed: boolean;
}

export interface YnabTransaction {
  id: string;
  date: string;
  amount: number;
  memo: string | null;
  cleared: 'cleared' | 'uncleared' | 'reconciled';
  approved: boolean;
  flag_color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | null;
  account_id: string;
  account_name: string;
  payee_id: string | null;
  payee_name: string | null;
  category_id: string | null;
  category_name: string | null;
}
