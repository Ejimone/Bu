import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useSales } from "@/context/SalesContext";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sales";

// Helper function to calculate profit
const calculateProfit = (sale: Sale): number => {
  return sale.items.reduce((profit, item) => {
    // Find the cost price from the product snapshot if available, otherwise guess?
    // For simplicity, we assume productSnapshot has costPrice, but it's not in the model.
    // Let's fetch the current product cost price for this example.
    // NOTE: This is inaccurate for historical profit if cost prices change.
    // A better approach would store costPrice in SaleItem.productSnapshot.
    const product = products.find((p) => p.id === item.productId);
    const costPrice = product?.costPrice || 0; // Fallback to 0 if product not found
    return profit + (item.subtotal - item.quantity * costPrice);
  }, 0);
};

// Global scope for products needed in helper
let products: Product[] = [];

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const { products: productData, isLoading: productsLoading } = useProducts();
  const { sales, isLoading: salesLoading } = useSales();

  // Update global products when data loads
  products = productData;

  // Redirect or show message if not admin
  if (user?.role !== "ADMIN") {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={{ color: colors.icon }}>
          You do not have permission to view reports.
        </Text>
      </View>
    );
  }

  if (productsLoading || salesLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  // --- Report Calculations ---
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.stockLevel * p.costPrice,
    0
  );
  const totalStockUnits = products.reduce((sum, p) => sum + p.stockLevel, 0);
  const lowStockProducts = products.filter(
    (p) => p.stockLevel <= p.lowStockThreshold
  );

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalAmountPaid = sales.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalOutstandingCredit = totalRevenue - totalAmountPaid;
  const numberOfSales = sales.length;
  const averageSaleValue = numberOfSales > 0 ? totalRevenue / numberOfSales : 0;

  // Calculate total profit (using helper function)
  const totalProfit = sales.reduce((sum, s) => sum + calculateProfit(s), 0);

  // Find best selling products (by quantity)
  const productSalesQuantity = sales.reduce((acc, sale) => {
    sale.items.forEach((item) => {
      acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const sortedProductsByQuantity = Object.entries(productSalesQuantity)
    .map(([productId, quantity]) => ({
      product: products.find((p) => p.id === productId),
      quantity,
    }))
    .filter((item) => item.product)
    .sort((a, b) => b.quantity - a.quantity);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Inventory Summary */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Inventory Summary
        </Text>
        <View
          style={[
            styles.reportCard,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: colors.icon }]}>
              Total Inventory Value:
            </Text>
            <Text style={[styles.reportValue, { color: colors.text }]}>
              ₦{totalInventoryValue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: colors.icon }]}>
              Total Stock Units:
            </Text>
            <Text style={[styles.reportValue, { color: colors.text }]}>
              {totalStockUnits}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: colors.icon }]}>
              Number of Products:
            </Text>
            <Text style={[styles.reportValue, { color: colors.text }]}>
              {products.length}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: colors.icon }]}>
              Low Stock Items:
            </Text>
            <Text
              style={[
                styles.reportValue,
                {
                  color:
                    lowStockProducts.length > 0 ? colors.warning : colors.text,
                },
              ]}
            >
              {lowStockProducts.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Sales Summary */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Sales Summary
        </Text>
        <View
          style={[
            styles.reportCard,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: colors.icon }]}>
              Total Revenue:
            </Text>
            <Text style={[styles.reportValue, { color: colors.success }]}>
              ₦{totalRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: colors.icon }]}>
              Total Profit (Est.):
            </Text>
            <Text
              style={[
                styles.reportValue,
                { color: totalProfit >= 0 ? colors.success : "#E74C3C" },
              ]}
            >
              ₦{totalProfit.toLocaleString()}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: colors.icon }]}>
              Number of Sales:
            </Text>
            <Text style={[styles.reportValue, { color: colors.text }]}>
              {numberOfSales}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: colors.icon }]}>
              Average Sale Value:
            </Text>
            <Text style={[styles.reportValue, { color: colors.text }]}>
              ₦
              {averageSaleValue.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={[styles.reportLabel, { color: colors.icon }]}>
              Outstanding Credit:
            </Text>
            <Text
              style={[
                styles.reportValue,
                {
                  color:
                    totalOutstandingCredit > 0 ? colors.warning : colors.text,
                },
              ]}
            >
              ₦{totalOutstandingCredit.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Best Selling Products */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Best Selling Products (by Quantity)
        </Text>
        <View
          style={[
            styles.reportCard,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          {sortedProductsByQuantity.length > 0 ? (
            sortedProductsByQuantity.slice(0, 5).map((item, index) => (
              <View
                key={item.product!.id}
                style={[
                  styles.reportRow,
                  {
                    borderBottomWidth: index < 4 ? 1 : 0,
                    borderBottomColor: colors.border,
                    paddingBottom: index < 4 ? 8 : 0,
                    marginBottom: index < 4 ? 8 : 0,
                  },
                ]}
              >
                <Text style={[styles.reportLabel, { color: colors.text }]}>
                  {item.product!.name}
                </Text>
                <Text style={[styles.reportValue, { color: colors.text }]}>
                  {item.quantity} units
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.icon }}>No sales data available.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  reportCard: {
    padding: 16,
    borderRadius: 12,
    // Platform-specific shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)", // Web equivalent
      },
    }),
  },
  reportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8, // Adjusted for potentially adding border
  },
  reportLabel: {
    fontSize: 16,
  },
  reportValue: {
    fontSize: 16,
    fontWeight: "500",
  },
});
