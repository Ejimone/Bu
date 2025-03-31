import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { useSales } from "@/context/SalesContext";
import { Sale } from "@/models/Sales";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function SalesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const { sales, isLoading } = useSales();

  // Sort sales by date, newest first
  const sortedSales = useMemo(() => {
    return [...sales].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [sales]);

  const handleNewSale = () => {
    router.push("/sales/new");
  };

  const handleViewSale = (sale: Sale) => {
    router.push(`/sales/detail/${sale.id}`);
  };

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={[
        styles.saleItem,
        {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={() => handleViewSale(item)}
    >
      <View style={styles.saleInfo}>
        <Text style={[styles.saleCustomer, { color: colors.text }]}>
          {item.customer?.name || "Walk-in Customer"}
        </Text>
        <Text style={[styles.saleDetail, { color: colors.icon }]}>
          {item.items.length} {item.items.length === 1 ? "item" : "items"} •
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      <View style={styles.saleAmountContainer}>
        <Text style={[styles.saleAmount, { color: colors.text }]}>
          ₦{item.totalAmount.toLocaleString()}
        </Text>
        <View style={styles.paymentStatusContainer}>
          <View
            style={[
              styles.paymentStatusDot,
              {
                backgroundColor:
                  item.paymentStatus === "PAID"
                    ? colors.success
                    : item.paymentStatus === "PARTIAL"
                    ? colors.warning
                    : "#E74C3C",
              },
            ]}
          />
          <Text style={[styles.paymentStatusText, { color: colors.icon }]}>
            {item.paymentStatus}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {user?.permissions.canMakeSales && (
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.newSaleButton, { backgroundColor: colors.tint }]}
            onPress={handleNewSale}
          >
            <IconSymbol size={20} name="plus" color="#FFFFFF" />
            <Text style={styles.newSaleButtonText}>Record New Sale</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={sortedSales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={{ color: colors.icon }}>No sales recorded yet.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  header: {
    padding: 16,
  },
  newSaleButton: {
    height: 50,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  newSaleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 80, // Adjust if using bottom tabs
  },
  saleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  saleInfo: {
    flex: 1,
    marginRight: 16,
  },
  saleCustomer: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  saleDetail: {
    fontSize: 14,
  },
  saleAmountContainer: {
    alignItems: "flex-end",
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  paymentStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  paymentStatusText: {
    fontSize: 12,
    textTransform: "uppercase",
  },
});
