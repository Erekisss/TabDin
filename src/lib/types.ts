export type TxType = "income" | "expense";
export type AccountType = "checking" | "savings" | "credit" | "investment" | "wallet";

export interface Account {
  id: string;
  name: string;
  institution: string | null;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  source: "manual" | "open_finance";
  connection_id: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: TxType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  type: TxType;
  date: string;
  notes: string | null;
  source: "manual" | "open_finance";
  category?: Pick<Category, "name" | "color" | "icon"> | null;
  account?: Pick<Account, "name" | "color"> | null;
}

export interface BankConnection {
  id: string;
  provider: "pluggy" | "demo";
  external_item_id: string;
  institution_name: string;
  institution_logo: string | null;
  institution_color: string | null;
  status: string;
  last_sync_at: string | null;
  created_at: string;
}

export interface VaultRow {
  id: string;
  kind: "login" | "card";
  ciphertext: string;
  iv: string;
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginSecret {
  title: string;
  url?: string;
  username: string;
  password: string;
  notes?: string;
}

export interface CardSecret {
  title: string;
  holder: string;
  number: string;
  expiry: string;
  cvv: string;
  pin?: string;
  brand?: string;
  notes?: string;
}

export type ActionState = { error?: string; success?: string } | undefined;

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  credit: "Cartão de crédito",
  investment: "Investimentos",
  wallet: "Carteira",
};
