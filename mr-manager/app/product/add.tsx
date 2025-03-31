import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { router } from "expo-router";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useProducts } from "@/context/ProductsContext";
import { Product } from "@/models/Product";

// Validation Schema
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
  stockLevel: yup
    .number()
    .typeError("Stock level must be a number")
    .required("Stock level is required")
    .integer("Stock level must be an integer")
    .min(0, "Stock level cannot be negative"),
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

type FormData = Omit<Product, "id" | "createdAt" | "updatedAt" | "imageUrl">;

export default function AddProductScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { addProduct } = useProducts();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      price: undefined,
      costPrice: undefined,
      stockLevel: undefined,
      lowStockThreshold: 5,
      reorderPoint: 3,
      category: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const newProduct = await addProduct(data);
      if (newProduct) {
        Alert.alert("Success", "Product added successfully!");
        router.back(); // Go back to the inventory list
      } else {
        Alert.alert("Error", "Failed to add product.");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        Add New Product
      </Text>

      <View style={styles.form}>
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
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>
          )}
        />

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
              />
            </View>
          )}
        />

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
              />
              {errors.category && (
                <Text style={styles.errorText}>{errors.category.message}</Text>
              )}
            </View>
          )}
        />

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

        <Controller
          control={control}
          name="stockLevel"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Initial Stock Level *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: errors.stockLevel ? "red" : colors.border,
                    color: colors.text,
                  },
                ]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value?.toString()}
                placeholder="0"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
              {errors.stockLevel && (
                <Text style={styles.errorText}>
                  {errors.stockLevel.message}
                </Text>
              )}
            </View>
          )}
        />

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
              />
            </View>
          )}
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.tint }]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Adding Product..." : "Add Product"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  form: {
    marginBottom: 40,
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
});
