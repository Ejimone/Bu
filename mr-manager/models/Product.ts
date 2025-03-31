export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  costPrice: number;
  stockLevel: number;
  lowStockThreshold: number;
  reorderPoint: number;
  category: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockActivity {
  id: string;
  productId: string;
  type: "ADD" | "REMOVE" | "ADJUST";
  quantity: number;
  reason?: string;
  date: Date;
  performedBy: string; // userId
}
