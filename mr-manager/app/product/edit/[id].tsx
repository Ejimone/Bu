import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { router, useLocalSearchParams } from "expo-router";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useProducts } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/models/Product";

// Validation Schema (similar to Add Product, but stockLevel is not required here)
const schema = yup.object().shape({
  name: yup.string().required("Product name is required"),
  description: yup.string(),
  sku: yup.string(),
  price: yup
    .number()
    .typeError("Price must be a number")
    .required("Price is required")
    .positive("Price must be positive"),
  costPrice: yup
    .number()
    .typeError("Cost price must be a number")
    .required("Cost price is required")
    .positive("Cost price must be positive"),
  lowStockThreshold: yup
    .number()
    .typeError("Threshold must be a number")
    .required("Low stock threshold is required")
    .integer()
    .min(0),
  reorderPoint: yup
    .number()
    .typeError("Reorder point must be a number")
    .required("Reorder point is required")
    .integer()
    .min(0),
  category: yup.string().required("Category is required"),
});

// Exclude stockLevel from the main form data type
type FormData = Omit<
  Product,
  "id" | "createdAt" | "updatedAt" | "imageUrl" | "stockLevel"
>;

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const {
    products,
    updateProduct,
    addStock,
    removeStock,
    adjustStock,
    isLoading: productsLoading,
  } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [stockAdjustmentType, setStockAdjustmentType] = useState<
    "ADD" | "REMOVE" | "SET"
  >("ADD");
  const [stockAdjustmentValue, setStockAdjustmentValue] = useState("");
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (id) {
      const foundProduct = products.find((p) => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
        // Reset form with product data, excluding stockLevel
        const { stockLevel, ...formData } = foundProduct;
        reset(formData);
      } else {
        // Handle product not found
        Alert.alert("Error", "Product not found.");
        router.back();
      }
    }
  }, [id, products, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    try {
      const updatedProduct = await updateProduct(id, data);
      if (updatedProduct) {
        Alert.alert("Success", "Product updated successfully!");
        router.back();
      } else {
        Alert.alert("Error", "Failed to update product.");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const handleStockAdjustment = async () => {
    if (!id || !user || !product) return;

    const quantity = parseInt(stockAdjustmentValue, 10);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid positive number for the quantity."
      );
      return;
    }

    let success = false;
    try {
      switch (stockAdjustmentType) {
        case "ADD":
          success = await addStock(
            id,
            quantity,
            user.id,
            stockAdjustmentReason || "Manual Adjustment"
          );
          break;
        case "REMOVE":
          if (quantity > product.stockLevel) {
            Alert.alert("Error", "Cannot remove more stock than available.");
            return;
          }
          success = await removeStock(
            id,
            quantity,
            user.id,
            stockAdjustmentReason || "Manual Adjustment"
          );
          break;
        case "SET":
          success = await adjustStock(
            id,
            quantity,
            user.id,
            stockAdjustmentReason || "Manual Adjustment"
          );
          break;
      }

      if (success) {
        Alert.alert("Success", "Stock level updated successfully!");
        setIsAdjustingStock(false);
        setStockAdjustmentValue("");
        setStockAdjustmentReason("");
        // No need to manually update product state here, context should trigger re-render
      } else {
        Alert.alert("Error", "Failed to update stock level.");
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred while adjusting stock."
      );
    }
  };

  if (productsLoading || !product) {
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Edit Product</Text>
      <Text style={[styles.subtitle, { color: colors.icon }]}>
        {product.name}
      </Text>

      {/* Product Details Form */}
      <View style={styles.form}>
        {/* Reuse form fields from AddProductScreen, controlled by react-hook-form */}
        {/* Name */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Product Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.name ? "red" : colors.border,
                    color: colors.text,
                  },
                ]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Enter product name"
                placeholderTextColor={colors.icon}
                editable={user?.permissions.canManageProducts}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>
          )}
        />

        {/* SKU */}
        <Controller
          control={control}
          name="sku"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                SKU (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Stock Keeping Unit"
                placeholderTextColor={colors.icon}
                editable={user?.permissions.canManageProducts}
              />
            </View>
          )}
        />

        {/* Category */}
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Category *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.category ? "red" : colors.border,
                    color: colors.text,
                  },
                ]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="e.g., Clothing, Electronics"
                placeholderTextColor={colors.icon}
                editable={user?.permissions.canManageProducts}
              />
              {errors.category && (
                <Text style={styles.errorText}>{errors.category.message}</Text>
              )}
            </View>
          )}
        />

        {/* Price Row */}
        <View style={styles.row}>
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Selling Price (₦) *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: errors.price ? "red" : colors.border,
                      color: colors.text,
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  placeholder="0.00"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                  editable={user?.permissions.canManageProducts}
                />
                {errors.price && (
                  <Text style={styles.errorText}>{errors.price.message}</Text>
                )}
              </View>
            )}
          />
          <Controller
            control={control}
            name="costPrice"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Cost Price (₦) *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: errors.costPrice ? "red" : colors.border,
                      color: colors.text,
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  placeholder="0.00"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                  editable={user?.permissions.canManageProducts}
                />
                {errors.costPrice && (
                  <Text style={styles.errorText}>
                    {errors.costPrice.message}
                  </Text>
                )}
              </View>
            )}
          />
        </View>

        {/* Threshold Row */}
        <View style={styles.row}>
          <Controller
            control={control}
            name="lowStockThreshold"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Low Stock Threshold *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: errors.lowStockThreshold
                        ? "red"
                        : colors.border,
                      color: colors.text,
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  placeholder="5"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                  editable={user?.permissions.canManageProducts}
                />
                {errors.lowStockThreshold && (
                  <Text style={styles.errorText}>
                    {errors.lowStockThreshold.message}
                  </Text>
                )}
              </View>
            )}
          />
          <Controller
            control={control}
            name="reorderPoint"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Reorder Point *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: errors.reorderPoint ? "red" : colors.border,
                      color: colors.text,
                    },
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  placeholder="3"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                  editable={user?.permissions.canManageProducts}
                />
                {errors.reorderPoint && (
                  <Text style={styles.errorText}>
                    {errors.reorderPoint.message}
                  </Text>
                )}
              </View>
            )}
          />
        </View>

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Description (Optional)
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Enter product description"
                placeholderTextColor={colors.icon}
                multiline
                numberOfLines={4}
                editable={user?.permissions.canManageProducts}
              />
            </View>
          )}
        />

        {user?.permissions.canManageProducts && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.tint }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stock Adjustment Section */}
      {user?.permissions.canAdjustInventory && (
        <View style={styles.stockSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Stock Management
          </Text>
          <View
            style={[
              styles.currentStockCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.currentStockLabel, { color: colors.icon }]}>
              Current Stock Level
            </Text>
            <Text style={[styles.currentStockValue, { color: colors.text }]}>
              {product.stockLevel}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.adjustStockButton,
              { backgroundColor: colors.accent },
            ]}
            onPress={() => setIsAdjustingStock(true)}
          >
            <Text style={styles.submitButtonText}>Adjust Stock</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAdjustingStock}
        onRequestClose={() => setIsAdjustingStock(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Adjust Stock Level
            </Text>

            <View style={styles.adjustmentTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.adjustmentTypeButton,
                  stockAdjustmentType === "ADD" &&
                    styles.adjustmentTypeSelected,
                  { borderColor: colors.border },
                ]}
                onPress={() => setStockAdjustmentType("ADD")}
              >
                <Text
                  style={{
                    color:
                      stockAdjustmentType === "ADD" ? colors.tint : colors.text,
                  }}
                >
                  Add (+)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.adjustmentTypeButton,
                  stockAdjustmentType === "REMOVE" &&
                    styles.adjustmentTypeSelected,
                  { borderColor: colors.border },
                ]}
                onPress={() => setStockAdjustmentType("REMOVE")}
              >
                <Text
                  style={{
                    color:
                      stockAdjustmentType === "REMOVE"
                        ? colors.tint
                        : colors.text,
                  }}
                >
                  Remove (-)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.adjustmentTypeButton,
                  stockAdjustmentType === "SET" &&
                    styles.adjustmentTypeSelected,
                  { borderColor: colors.border },
                ]}
                onPress={() => setStockAdjustmentType("SET")}
              >
                <Text
                  style={{
                    color:
                      stockAdjustmentType === "SET" ? colors.tint : colors.text,
                  }}
                >
                  Set (=)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {stockAdjustmentType === "ADD"
                  ? "Quantity to Add"
                  : stockAdjustmentType === "REMOVE"
                  ? "Quantity to Remove"
                  : "New Stock Level"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={stockAdjustmentValue}
                onChangeText={setStockAdjustmentValue}
                placeholder="Enter quantity"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Reason (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={stockAdjustmentReason}
                onChangeText={setStockAdjustmentReason}
                placeholder="e.g., Stock count, Damage, Received shipment"
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.icon + "30" },
                ]}
                onPress={() => setIsAdjustingStock(false)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={handleStockAdjustment}
              >
                <Text style={styles.submitButtonText}>Confirm Adjustment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Add/reuse styles from AddProductScreen and add new ones for stock section and modal
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Stock Section Styles
  stockSection: {
    marginTop: 16,
    marginBottom: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E1E8ED",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  currentStockCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  currentStockLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  currentStockValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  adjustStockButton: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  adjustmentTypeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  adjustmentTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  adjustmentTypeSelected: {
    backgroundColor: Colors.light.tint + "20", // Use a light tint background for selected
    borderColor: Colors.light.tint,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
});
