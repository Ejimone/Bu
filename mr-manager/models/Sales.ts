import { Product } from "./Product";

export type PaymentStatus = "PAID" | "CREDIT" | "PARTIAL";

export interface SaleItem {
  id: string;
  productId: string;
  productSnapshot: Partial<Product>; // Store product details at time of sale
  quantity: number;
  pricePerUnit: number;
  discount?: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  customer?: {
    name: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
  soldBy: string; // userId
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditPayment {
  id: string;
  saleId: string;
  amount: number;
  paymentMethod: string;
  receivedBy: string; // userId
  notes?: string;
  paymentDate: Date;
}
