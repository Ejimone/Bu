import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { Product } from "@/models/Product";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const { products, isLoading, deleteProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery) {
      return products;
    }
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleAddProduct = () => {
    // Navigate to a dedicated Add Product screen or open a modal
    // For simplicity, let's assume navigation
    router.push("/product/add");
  };

  const handleEditProduct = (product: Product) => {
    router.push(`/product/edit/${product.id}`);
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete ${product.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteProduct(product.id);
            if (!success) {
              Alert.alert("Error", "Failed to delete product.");
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[
        styles.productItem,
        {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={() =>
        user?.permissions.canManageProducts ? handleEditProduct(item) : null
      }
    >
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.productDetail, { color: colors.icon }]}>
          SKU: {item.sku || "N/A"} • Price: ₦{item.price.toLocaleString()}
        </Text>
      </View>
      <View style={styles.productStockContainer}>
        <Text
          style={[
            styles.productStock,
            {
              color:
                item.stockLevel <= item.lowStockThreshold
                  ? colors.warning
                  : colors.text,
            },
          ]}
        >
          {item.stockLevel}
        </Text>
        <Text style={[styles.stockLabel, { color: colors.icon }]}>
          in stock
        </Text>
      </View>
      {user?.permissions.canManageProducts && (
        <TouchableOpacity
          onPress={() => handleDeleteProduct(item)}
          style={styles.deleteButton}
        >
          <IconSymbol size={20} name="trash.fill" color="#E74C3C" />
        </TouchableOpacity>
      )}
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
      <View style={styles.header}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          placeholder="Search products by name or SKU..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {user?.permissions.canManageProducts && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={handleAddProduct}
          >
            <IconSymbol size={20} name="plus" color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={{ color: colors.icon }}>No products found.</Text>
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
  },
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    width: 45,
    height: 45,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 80, // Adjust if using bottom tabs
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productDetail: {
    fontSize: 14,
  },
  productStockContainer: {
    alignItems: "center",
    minWidth: 60,
  },
  productStock: {
    fontSize: 18,
    fontWeight: "bold",
  },
  stockLabel: {
    fontSize: 12,
  },
  deleteButton: {
    marginLeft: 12,
    padding: 8,
  },
});
