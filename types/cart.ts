export type CartSummaryItem = {
  id: string;
  partStkNo: string;
  description: string | null;
  qty: number;
  unitPrice: string;
  lineTotal: string;
};

export type CartSummary = {
  items: CartSummaryItem[];
  total: string;
};
