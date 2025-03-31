import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product, StockActivity } from "../models/Product";

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  stockActivities: StockActivity[];
  addProduct: (
    product: Omit<Product, "id" | "createdAt" | "updatedAt">
  ) => Promise<Product>;
  updateProduct: (
    id: string,
    updates: Partial<Product>
  ) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  addStock: (
    productId: string,
    quantity: number,
    userId: string,
    reason?: string
  ) => Promise<boolean>;
  removeStock: (
    productId: string,
    quantity: number,
    userId: string,
    reason?: string
  ) => Promise<boolean>;
  adjustStock: (
    productId: string,
    newQuantity: number,
    userId: string,
    reason?: string
  ) => Promise<boolean>;
  getLowStockProducts: () => Product[];
}

// Sample data for demo purposes
const DEMO_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "T-Shirt",
    description: "Cotton t-shirt, size M",
    sku: "TS-001",
    price: 1500,
    costPrice: 1000,
    stockLevel: 25,
    lowStockThreshold: 10,
    reorderPoint: 5,
    category: "Clothing",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Jeans",
    description: "Blue denim jeans, size 32",
    sku: "JN-001",
    price: 3500,
    costPrice: 2200,
    stockLevel: 15,
    lowStockThreshold: 8,
    reorderPoint: 5,
    category: "Clothing",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Sneakers",
    description: "Canvas sneakers, size 42",
    sku: "SN-001",
    price: 4500,
    costPrice: 3000,
    stockLevel: 8,
    lowStockThreshold: 10,
    reorderPoint: 5,
    category: "Footwear",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const PRODUCTS_STORAGE_KEY = "@InventoryApp:Products";
const STOCK_ACTIVITIES_STORAGE_KEY = "@InventoryApp:StockActivities";

// Helper to rehydrate Date objects from JSON
const rehydrateProductDates = (product: Product): Product => ({
  ...product,
  createdAt: new Date(product.createdAt),
  updatedAt: new Date(product.updatedAt),
});

const rehydrateActivityDates = (activity: StockActivity): StockActivity => ({
  ...activity,
  date: new Date(activity.date),
});

const ProductsContext = createContext<ProductsContextType>({
  products: [],
  isLoading: true,
  stockActivities: [],
  addProduct: async () => ({} as Product),
  updateProduct: async () => null,
  deleteProduct: async () => false,
  addStock: async () => false,
  removeStock: async () => false,
  adjustStock: async () => false,
  getLowStockProducts: () => [],
});

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockActivities, setStockActivities] = useState<StockActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Persistence ---
  const saveData = useCallback(
    async (newProducts: Product[], newActivities: StockActivity[]) => {
      try {
        await AsyncStorage.setItem(
          PRODUCTS_STORAGE_KEY,
          JSON.stringify(newProducts)
        );
        await AsyncStorage.setItem(
          STOCK_ACTIVITIES_STORAGE_KEY,
          JSON.stringify(newActivities)
        );
      } catch (error) {
        console.error("Failed to save data to storage", error);
        // Optionally show an error to the user
      }
    },
    []
  );

  // Load initial data from storage or use demo data
  useEffect(() => {
    const loadData = async () => {
      let loadedProducts: Product[] = [];
      let loadedActivities: StockActivity[] = [];
      try {
        const storedProducts = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
        const storedActivities = await AsyncStorage.getItem(
          STOCK_ACTIVITIES_STORAGE_KEY
        );

        if (storedProducts) {
          loadedProducts = (JSON.parse(storedProducts) as Product[]).map(
            rehydrateProductDates
          );
        } else {
          // Initialize with demo data if nothing in storage
          loadedProducts = DEMO_PRODUCTS;
        }

        if (storedActivities) {
          loadedActivities = (
            JSON.parse(storedActivities) as StockActivity[]
          ).map(rehydrateActivityDates);
        } else {
          loadedActivities = []; // Start with empty activities
        }
      } catch (error) {
        console.error("Failed to load data from storage", error);
        // Fallback to demo data in case of error
        loadedProducts = DEMO_PRODUCTS;
        loadedActivities = [];
        // Clear potentially corrupted data
        await AsyncStorage.removeItem(PRODUCTS_STORAGE_KEY);
        await AsyncStorage.removeItem(STOCK_ACTIVITIES_STORAGE_KEY);
      } finally {
        setProducts(loadedProducts);
        setStockActivities(loadedActivities);
        setIsLoading(false);
        // Save initial demo data if storage was empty
        if (!(await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY))) {
          saveData(loadedProducts, loadedActivities);
        }
      }
    };

    loadData();
  }, [saveData]); // Include saveData in dependency array

  // --- CRUD Operations (Modified to save after state update) ---

  const addProduct = async (
    productData: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(), // Simple ID generation
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    await saveData(updatedProducts, stockActivities);
    return newProduct;
  };

  const updateProduct = async (
    id: string,
    updates: Partial<Product>
  ): Promise<Product | null> => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updatedProduct = {
      ...products[index],
      ...updates,
      updatedAt: new Date(),
    };

    const updatedProducts = [...products];
    updatedProducts[index] = updatedProduct;
    setProducts(updatedProducts);
    await saveData(updatedProducts, stockActivities);
    return updatedProduct;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    const updatedProducts = products.filter((p) => p.id !== id);
    // Also consider deleting related stock activities if necessary
    setProducts(updatedProducts);
    await saveData(updatedProducts, stockActivities);
    return true;
  };

  const createStockActivity = (
    type: "ADD" | "REMOVE" | "ADJUST",
    productId: string,
    quantity: number,
    userId: string,
    reason?: string
  ): StockActivity => {
    return {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // More unique ID
      productId,
      type,
      quantity,
      reason,
      date: new Date(),
      performedBy: userId,
    };
  };

  const addStock = async (
    productId: string,
    quantity: number,
    userId: string,
    reason?: string
  ): Promise<boolean> => {
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return false;

    const updatedProduct = {
      ...products[index],
      stockLevel: products[index].stockLevel + quantity,
      updatedAt: new Date(),
    };

    const updatedProducts = [...products];
    updatedProducts[index] = updatedProduct;
    setProducts(updatedProducts);

    // Record activity
    const activity = createStockActivity(
      "ADD",
      productId,
      quantity,
      userId,
      reason
    );
    const updatedActivities = [...stockActivities, activity];
    setStockActivities(updatedActivities);

    await saveData(updatedProducts, updatedActivities);
    return true;
  };

  const removeStock = async (
    productId: string,
    quantity: number,
    userId: string,
    reason?: string
  ): Promise<boolean> => {
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return false;

    // Don't allow negative stock
    if (products[index].stockLevel < quantity) return false;

    const updatedProduct = {
      ...products[index],
      stockLevel: products[index].stockLevel - quantity,
      updatedAt: new Date(),
    };

    const updatedProducts = [...products];
    updatedProducts[index] = updatedProduct;
    setProducts(updatedProducts);

    // Record activity
    const activity = createStockActivity(
      "REMOVE",
      productId,
      quantity,
      userId,
      reason
    );
    const updatedActivities = [...stockActivities, activity];
    setStockActivities(updatedActivities);

    await saveData(updatedProducts, updatedActivities);
    return true;
  };

  const adjustStock = async (
    productId: string,
    newQuantity: number,
    userId: string,
    reason?: string
  ): Promise<boolean> => {
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) return false;

    const difference = newQuantity - products[index].stockLevel;

    const updatedProduct = {
      ...products[index],
      stockLevel: newQuantity,
      updatedAt: new Date(),
    };

    const updatedProducts = [...products];
    updatedProducts[index] = updatedProduct;
    setProducts(updatedProducts);

    // Record activity
    const activity = createStockActivity(
      "ADJUST",
      productId,
      Math.abs(difference),
      userId,
      reason
    );
    const updatedActivities = [...stockActivities, activity];
    setStockActivities(updatedActivities);

    await saveData(updatedProducts, updatedActivities);
    return true;
  };

  const getLowStockProducts = (): Product[] => {
    return products.filter(
      (product) => product.stockLevel <= product.lowStockThreshold
    );
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        isLoading,
        stockActivities,
        addProduct,
        updateProduct,
        deleteProduct,
        addStock,
        removeStock,
        adjustStock,
        getLowStockProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => useContext(ProductsContext);
