import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Sale, SaleItem, CreditPayment, PaymentStatus } from "../models/Sales";
import { useProducts } from "./ProductsContext";

interface SalesContextType {
  sales: Sale[];
  creditPayments: CreditPayment[];
  isLoading: boolean;
  createSale: (
    items: Omit<SaleItem, "id" | "subtotal">[],
    amountPaid: number,
    soldBy: string,
    customer?: { name: string; phone?: string; email?: string },
    notes?: string
  ) => Promise<Sale | null>;
  getSale: (id: string) => Sale | null;
  addCreditPayment: (
    saleId: string,
    amount: number,
    receivedBy: string,
    paymentMethod: string,
    notes?: string
  ) => Promise<CreditPayment | null>;
  getCreditSales: () => Sale[];
  getTotalSales: () => number;
  getTodaySales: () => Sale[];
}

const SALES_STORAGE_KEY = "@InventoryApp:Sales";
const CREDIT_PAYMENTS_STORAGE_KEY = "@InventoryApp:CreditPayments";

// Helper to rehydrate Date objects from JSON
const rehydrateSaleDates = (sale: Sale): Sale => ({
  ...sale,
  createdAt: new Date(sale.createdAt),
  updatedAt: new Date(sale.updatedAt),
  // Note: SaleItem.productSnapshot dates are not stored/rehydrated here
});

const rehydratePaymentDates = (payment: CreditPayment): CreditPayment => ({
  ...payment,
  paymentDate: new Date(payment.paymentDate),
});

const SalesContext = createContext<SalesContextType>({
  sales: [],
  creditPayments: [],
  isLoading: true, // Start with loading true
  createSale: async () => null,
  getSale: () => null,
  addCreditPayment: async () => null,
  getCreditSales: () => [],
  getTotalSales: () => 0,
  getTodaySales: () => [],
});

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [creditPayments, setCreditPayments] = useState<CreditPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start loading

  const { products, removeStock } = useProducts(); // Assuming useProducts handles its own loading

  // --- Data Persistence ---
  const saveData = useCallback(
    async (newSales: Sale[], newPayments: CreditPayment[]) => {
      try {
        await AsyncStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(newSales));
        await AsyncStorage.setItem(
          CREDIT_PAYMENTS_STORAGE_KEY,
          JSON.stringify(newPayments)
        );
      } catch (error) {
        console.error("Failed to save sales data to storage", error);
      }
    },
    []
  );

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      let loadedSales: Sale[] = [];
      let loadedPayments: CreditPayment[] = [];
      try {
        const storedSales = await AsyncStorage.getItem(SALES_STORAGE_KEY);
        const storedPayments = await AsyncStorage.getItem(
          CREDIT_PAYMENTS_STORAGE_KEY
        );

        if (storedSales) {
          loadedSales = (JSON.parse(storedSales) as Sale[]).map(
            rehydrateSaleDates
          );
        }
        if (storedPayments) {
          loadedPayments = (JSON.parse(storedPayments) as CreditPayment[]).map(
            rehydratePaymentDates
          );
        }
      } catch (error) {
        console.error("Failed to load sales data from storage", error);
        // Clear potentially corrupted data
        await AsyncStorage.removeItem(SALES_STORAGE_KEY);
        await AsyncStorage.removeItem(CREDIT_PAYMENTS_STORAGE_KEY);
      } finally {
        setSales(loadedSales);
        setCreditPayments(loadedPayments);
        setIsLoading(false); // Finish loading
      }
    };

    loadData();
  }, []); // Load only once on mount

  // --- Sale Operations (Modified to save) ---

  const createSale = async (
    itemsData: Omit<SaleItem, "id" | "subtotal">[],
    amountPaid: number,
    soldBy: string,
    customer?: { name: string; phone?: string; email?: string },
    notes?: string
  ): Promise<Sale | null> => {
    setIsLoading(true); // Indicate loading during sale creation
    try {
      // Calculate subtotal for each item and add IDs
      const saleItems: SaleItem[] = itemsData.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }
        const subtotal =
          item.quantity * item.pricePerUnit - (item.discount || 0);
        return {
          id:
            Date.now().toString() + Math.random().toString(36).substring(2, 9),
          ...item,
          productSnapshot: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            // Consider adding costPrice here if needed for accurate historical profit
          },
          subtotal,
        };
      });

      const totalAmount = saleItems.reduce(
        (acc, item) => acc + item.subtotal,
        0
      );
      let paymentStatus: PaymentStatus = "PAID";
      if (amountPaid < totalAmount) {
        paymentStatus = amountPaid === 0 ? "CREDIT" : "PARTIAL";
      }

      const newSale: Sale = {
        id: Date.now().toString() + Math.random().toString(36).substring(7, 13), // Slightly different ID generation
        items: saleItems,
        totalAmount,
        amountPaid,
        balance: totalAmount - amountPaid,
        paymentStatus,
        soldBy,
        customer,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update inventory (this comes from useProducts, which should handle its own persistence)
      for (const item of saleItems) {
        const success = await removeStock(
          item.productId,
          item.quantity,
          soldBy,
          `Sale: ${newSale.id}`
        );
        if (!success) {
          // Attempt to rollback or handle error - simple throw for now
          throw new Error(
            `Failed to update inventory for product ${item.productId}. Sale not completed.`
          );
        }
      }

      // Save the sale
      const updatedSales = [...sales, newSale];
      setSales(updatedSales);
      await saveData(updatedSales, creditPayments); // Save sales, payments haven't changed yet

      setIsLoading(false);
      return newSale;
    } catch (error) {
      console.error("Error creating sale:", error);
      setIsLoading(false);
      // Handle potential inventory rollback if needed
      return null;
    }
  };

  const getSale = (id: string): Sale | null => {
    return sales.find((sale) => sale.id === id) || null;
  };

  const addCreditPayment = async (
    saleId: string,
    amount: number,
    receivedBy: string,
    paymentMethod: string,
    notes?: string
  ): Promise<CreditPayment | null> => {
    setIsLoading(true);
    try {
      const saleIndex = sales.findIndex((s) => s.id === saleId);
      if (saleIndex === -1) {
        throw new Error(`Sale with ID ${saleId} not found`);
      }
      const sale = sales[saleIndex];

      if (amount <= 0 || amount > sale.balance) {
        throw new Error(`Invalid payment amount`);
      }

      const payment: CreditPayment = {
        id: Date.now().toString() + Math.random().toString(36).substring(5, 12),
        saleId,
        amount,
        receivedBy,
        paymentMethod,
        notes,
        paymentDate: new Date(),
      };

      const updatedSale = {
        ...sale,
        amountPaid: sale.amountPaid + amount,
        balance: sale.balance - amount,
        paymentStatus: sale.balance - amount <= 0.001 ? "PAID" : "PARTIAL", // Use tolerance for float comparison
        updatedAt: new Date(),
      };

      const updatedSales = [...sales];
      updatedSales[saleIndex] = updatedSale;
      const updatedPayments = [...creditPayments, payment];

      setSales(updatedSales);
      setCreditPayments(updatedPayments);
      await saveData(updatedSales, updatedPayments);

      setIsLoading(false);
      return payment;
    } catch (error) {
      console.error("Error adding credit payment:", error);
      setIsLoading(false);
      return null;
    }
  };

  // --- Read Operations (No changes needed) ---
  const getCreditSales = (): Sale[] => {
    return sales.filter(
      (sale) =>
        sale.paymentStatus === "CREDIT" || sale.paymentStatus === "PARTIAL"
    );
  };

  const getTotalSales = (): number => {
    return sales.reduce((total, sale) => total + sale.totalAmount, 0);
  };

  const getTodaySales = (): Sale[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });
  };

  return (
    <SalesContext.Provider
      value={{
        sales,
        creditPayments,
        isLoading,
        createSale,
        getSale,
        addCreditPayment,
        getCreditSales,
        getTotalSales,
        getTodaySales,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => useContext(SalesContext);
