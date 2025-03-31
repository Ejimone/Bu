import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { router } from "expo-router";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useSales } from "@/context/SalesContext";
import { Product } from "@/models/Product";
import { SaleItem } from "@/models/Sales";
import { IconSymbol } from "@/components/ui/IconSymbol";

interface CartItem extends SaleItem {
  productName: string;
  availableStock: number;
}

export default function NewSaleScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const { createSale, isLoading: salesLoading } = useSales();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");

  const availableProducts = useMemo(() => {
    if (!productSearchQuery) {
      return products.filter((p) => p.stockLevel > 0);
    }
    return products.filter(
      (p) =>
        p.stockLevel > 0 &&
        (p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(productSearchQuery.toLowerCase()))
    );
  }, [products, productSearchQuery]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const handleAddProductToCart = (product: Product) => {
    const existingCartItem = cart.find((item) => item.productId === product.id);

    if (existingCartItem) {
      // If item exists, increment quantity if stock allows
      if (existingCartItem.quantity < product.stockLevel) {
        updateCartItemQuantity(product.id, existingCartItem.quantity + 1);
      }
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        id: product.id, // Use product ID temporarily, context will generate final ID
        productId: product.id,
        productName: product.name,
        quantity: 1,
        pricePerUnit: product.price,
        subtotal: product.price, // Initial subtotal for quantity 1
        availableStock: product.stockLevel,
        productSnapshot: {
          // Snapshot for the sale record
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
        },
      };
      setCart([...cart, newItem]);
    }
    setIsProductModalVisible(false);
    setProductSearchQuery("");
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    setCart(
      (currentCart) =>
        currentCart
          .map((item) => {
            if (item.productId === productId) {
              if (newQuantity > 0 && newQuantity <= item.availableStock) {
                return {
                  ...item,
                  quantity: newQuantity,
                  subtotal:
                    newQuantity * item.pricePerUnit - (item.discount || 0),
                };
              } else if (newQuantity === 0) {
                // Remove item if quantity is 0
                return null;
              }
            }
            return item;
          })
          .filter((item) => item !== null) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.productId !== productId)
    );
  };

  const handleFinalizeSale = async () => {
    if (!user) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Error", "Cart is empty.");
      return;
    }

    const paidAmount = parseFloat(amountPaid) || 0;
    if (paidAmount < 0) {
      Alert.alert("Error", "Amount paid cannot be negative.");
      return;
    }
    if (paidAmount > totalAmount) {
      Alert.alert("Error", "Amount paid cannot exceed the total amount.");
      return;
    }

    const saleItems: Omit<SaleItem, "id" | "subtotal">[] = cart.map((item) => ({
      productId: item.productId,
      productSnapshot: item.productSnapshot,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      discount: item.discount,
    }));

    const customer = customerName
      ? { name: customerName, phone: customerPhone }
      : undefined;

    const success = await createSale(
      saleItems,
      paidAmount,
      user.id,
      customer,
      notes
    );

    if (success) {
      Alert.alert("Success", "Sale recorded successfully!");
      router.back(); // Go back to sales list
    } else {
      Alert.alert(
        "Error",
        "Failed to record sale. Please check inventory levels and try again."
      );
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartItem, { borderBottomColor: colors.border }]}>
      <View style={styles.cartItemInfo}>
        <Text style={[styles.cartItemName, { color: colors.text }]}>
          {item.productName}
        </Text>
        <Text style={[styles.cartItemPrice, { color: colors.icon }]}>
          ₦{item.pricePerUnit.toLocaleString()} x {item.quantity}
        </Text>
      </View>
      <View style={styles.cartItemQuantityControl}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() =>
            updateCartItemQuantity(item.productId, item.quantity - 1)
          }
        >
          <IconSymbol size={18} name="minus" color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.cartItemQuantity, { color: colors.text }]}>
          {item.quantity}
        </Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() =>
            updateCartItemQuantity(item.productId, item.quantity + 1)
          }
          disabled={item.quantity >= item.availableStock}
        >
          <IconSymbol
            size={18}
            name="plus"
            color={
              item.quantity >= item.availableStock ? colors.icon : colors.tint
            }
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.cartItemSubtotal, { color: colors.text }]}>
        ₦{item.subtotal.toLocaleString()}
      </Text>
      <TouchableOpacity
        onPress={() => handleRemoveItem(item.productId)}
        style={styles.removeItemButton}
      >
        <IconSymbol size={18} name="trash" color="#E74C3C" />
      </TouchableOpacity>
    </View>
  );

  const renderProductSelectItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productSelectItem, { borderBottomColor: colors.border }]}
      onPress={() => handleAddProductToCart(item)}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.productSelectName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.productSelectDetail, { color: colors.icon }]}>
          SKU: {item.sku || "N/A"}
        </Text>
      </View>
      <Text style={[styles.productSelectPrice, { color: colors.text }]}>
        ₦{item.price.toLocaleString()}
      </Text>
      <Text style={[styles.productSelectStock, { color: colors.icon }]}>
        {item.stockLevel} in stock
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cart Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Cart Items
          </Text>
          {cart.length === 0 ? (
            <Text style={[styles.emptyCartText, { color: colors.icon }]}>
              Cart is empty. Add products below.
            </Text>
          ) : (
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.productId}
              scrollEnabled={false} // Disable scrolling within the ScrollView
            />
          )}
          <TouchableOpacity
            style={[styles.addProductButton, { borderColor: colors.tint }]}
            onPress={() => setIsProductModalVisible(true)}
          >
            <IconSymbol size={18} name="plus" color={colors.tint} />
            <Text style={[styles.addProductButtonText, { color: colors.tint }]}>
              Add Product
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer & Payment Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Customer & Payment
          </Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Customer Name (Optional)
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
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter customer name"
              placeholderTextColor={colors.icon}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Customer Phone (Optional)
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
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="Enter customer phone number"
              placeholderTextColor={colors.icon}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Amount Paid (₦)
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
              value={amountPaid}
              onChangeText={setAmountPaid}
              placeholder={`Total: ₦${totalAmount.toLocaleString()}`}
              placeholderTextColor={colors.icon}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Notes (Optional)
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
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes for this sale"
              placeholderTextColor={colors.icon}
              multiline
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer Summary & Action */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.cardBackground,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.icon }]}>
            Total Amount:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            ₦{totalAmount.toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.finalizeButton,
            {
              backgroundColor:
                cart.length > 0 ? colors.success : colors.icon + "50",
            },
          ]}
          onPress={handleFinalizeSale}
          disabled={cart.length === 0 || salesLoading}
        >
          {salesLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.finalizeButtonText}>Finalize Sale</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Selection Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isProductModalVisible}
        onRequestClose={() => setIsProductModalVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <TextInput
              style={[
                styles.modalSearchInput,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Search products..."
              placeholderTextColor={colors.icon}
              value={productSearchQuery}
              onChangeText={setProductSearchQuery}
            />
            <TouchableOpacity
              onPress={() => setIsProductModalVisible(false)}
              style={styles.closeModalButton}
            >
              <IconSymbol size={24} name="xmark" color={colors.text} />
            </TouchableOpacity>
          </View>
          {productsLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.tint}
              style={{ flex: 1 }}
            />
          ) : (
            <FlatList
              data={availableProducts}
              renderItem={renderProductSelectItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={() => (
                <View style={styles.centeredModalContent}>
                  <Text style={{ color: colors.icon }}>
                    No products match your search or are out of stock.
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for the footer
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyCartText: {
    textAlign: "center",
    paddingVertical: 20,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
  },
  cartItemQuantityControl: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
  },
  quantityButton: {
    padding: 8,
  },
  cartItemQuantity: {
    fontSize: 16,
    fontWeight: "500",
    minWidth: 30,
    textAlign: "center",
  },
  cartItemSubtotal: {
    fontSize: 16,
    fontWeight: "500",
    minWidth: 80,
    textAlign: "right",
  },
  removeItemButton: {
    marginLeft: 12,
    padding: 8,
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
  },
  addProductButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 16,
    textAlignVertical: "top",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24, // Extra padding for safe area
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  finalizeButton: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  finalizeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40, // Adjust for status bar
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8ED",
  },
  modalSearchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 12,
  },
  closeModalButton: {
    padding: 8,
  },
  productSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  productSelectName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  productSelectDetail: {
    fontSize: 12,
  },
  productSelectPrice: {
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 16,
  },
  productSelectStock: {
    fontSize: 14,
  },
  centeredModalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
