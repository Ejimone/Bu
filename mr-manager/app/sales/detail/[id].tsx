import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform, // <-- Import Platform
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { useSales } from "@/context/SalesContext";
import { Sale, CreditPayment } from "@/models/Sales";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const { getSale, addCreditPayment, creditPayments, isLoading } = useSales();

  const [sale, setSale] = useState<Sale | null>(null);
  const [relatedPayments, setRelatedPayments] = useState<CreditPayment[]>([]);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");

  useEffect(() => {
    if (id) {
      const foundSale = getSale(id);
      setSale(foundSale);

      if (foundSale) {
        // Find related credit payments
        const payments = creditPayments.filter((p) => p.saleId === id);
        setRelatedPayments(
          payments.sort(
            (a, b) =>
              new Date(b.paymentDate).getTime() -
              new Date(a.paymentDate).getTime()
          )
        );
      }
    } else {
      Alert.alert("Error", "Sale ID not provided.");
      router.back();
    }
  }, [id, getSale, creditPayments]);

  const handleAddPayment = async () => {
    if (!sale || !user) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid positive payment amount."
      );
      return;
    }
    if (amount > sale.balance) {
      Alert.alert(
        "Invalid Input",
        `Payment amount cannot exceed the outstanding balance of ₦${sale.balance.toLocaleString()}.`
      );
      return;
    }

    const success = await addCreditPayment(
      sale.id,
      amount,
      user.id,
      paymentMethod,
      paymentNotes
    );

    if (success) {
      Alert.alert("Success", "Payment recorded successfully!");
      setIsPaymentModalVisible(false);
      setPaymentAmount("");
      setPaymentNotes("");
      // The useEffect hook will update the sale and payments list
    } else {
      Alert.alert("Error", "Failed to record payment.");
    }
  };

  if (isLoading || !sale) {
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

  const renderSaleItem = ({
    item,
    index,
  }: {
    item: Sale["items"][0];
    index: number;
  }) => (
    <View
      key={index}
      style={[styles.listItem, { borderBottomColor: colors.border }]}
    >
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, { color: colors.text }]}>
          {item.productSnapshot.name}
        </Text>
        <Text style={[styles.itemSku, { color: colors.icon }]}>
          SKU: {item.productSnapshot.sku || "N/A"}
        </Text>
      </View>
      <View style={styles.itemQuantityPrice}>
        <Text style={[styles.itemText, { color: colors.text }]}>
          {item.quantity} x ₦{item.pricePerUnit.toLocaleString()}
        </Text>
      </View>
      <View style={styles.itemSubtotal}>
        <Text style={[styles.itemText, { color: colors.text }]}>
          ₦{item.subtotal.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderPaymentItem = ({
    item,
    index,
  }: {
    item: CreditPayment;
    index: number;
  }) => (
    <View
      key={index}
      style={[styles.listItem, { borderBottomColor: colors.border }]}
    >
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, { color: colors.text }]}>
          Payment Received
        </Text>
        <Text style={[styles.itemSku, { color: colors.icon }]}>
          {new Date(item.paymentDate).toLocaleString()} by {item.receivedBy} (
          {item.paymentMethod})
        </Text>
        {item.notes && (
          <Text style={[styles.itemSku, { color: colors.icon, marginTop: 2 }]}>
            Note: {item.notes}
          </Text>
        )}
      </View>
      <View style={styles.itemSubtotal}>
        <Text style={[styles.itemText, { color: colors.success }]}>
          + ₦{item.amount.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Sale Header Info */}
      <View
        style={[styles.headerCard, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Sale #{sale.id.substring(0, 6)}
        </Text>
        <Text style={[styles.headerDate, { color: colors.icon }]}>
          {new Date(sale.createdAt).toLocaleString()}
        </Text>
        {sale.customer && (
          <Text style={[styles.headerCustomer, { color: colors.text }]}>
            Customer: {sale.customer.name}{" "}
            {sale.customer.phone ? `(${sale.customer.phone})` : ""}
          </Text>
        )}
        <Text style={[styles.headerSoldBy, { color: colors.icon }]}>
          Sold by: {sale.soldBy}
        </Text>
        {sale.notes && (
          <Text style={[styles.headerNotes, { color: colors.icon }]}>
            Notes: {sale.notes}
          </Text>
        )}
      </View>

      {/* Items List */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Items Sold
        </Text>
        <View
          style={[
            styles.listContainer,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          {sale.items.map((item, index) => renderSaleItem({ item, index }))}
        </View>
      </View>

      {/* Payment Summary & History */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Payment Summary
        </Text>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.icon }]}>
              Total Amount:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ₦{sale.totalAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.icon }]}>
              Amount Paid:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              ₦{sale.amountPaid.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.balanceRow]}>
            <Text
              style={[
                styles.summaryLabel,
                styles.balanceLabel,
                { color: colors.text },
              ]}
            >
              Balance Due:
            </Text>
            <Text
              style={[
                styles.summaryValue,
                styles.balanceValue,
                { color: sale.balance > 0 ? "#E74C3C" : colors.success },
              ]}
            >
              ₦{sale.balance.toLocaleString()}
            </Text>
          </View>
          {sale.balance > 0 && user?.permissions.canMakeSales && (
            <TouchableOpacity
              style={[
                styles.addPaymentButton,
                { backgroundColor: colors.accent },
              ]}
              onPress={() => setIsPaymentModalVisible(true)}
            >
              <Text style={styles.addPaymentButtonText}>Record Payment</Text>
            </TouchableOpacity>
          )}
        </View>

        {relatedPayments.length > 0 && (
          <View
            style={[
              styles.listContainer,
              { backgroundColor: colors.cardBackground, marginTop: 16 },
            ]}
          >
            <Text style={[styles.paymentHistoryTitle, { color: colors.text }]}>
              Payment History
            </Text>
            {relatedPayments.map((payment, index) =>
              renderPaymentItem({ item: payment, index })
            )}
          </View>
        )}
      </View>

      {/* Add Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPaymentModalVisible}
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Record Credit Payment
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
              Outstanding Balance: ₦{sale.balance.toLocaleString()}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Amount Received (₦)
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
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Enter amount"
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Payment Method
              </Text>
              {/* Basic method selection - could be a Picker */}
              <View style={styles.methodSelector}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    paymentMethod === "Cash" && styles.methodSelected,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setPaymentMethod("Cash")}
                >
                  <Text
                    style={{
                      color:
                        paymentMethod === "Cash" ? colors.tint : colors.text,
                    }}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    paymentMethod === "Transfer" && styles.methodSelected,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setPaymentMethod("Transfer")}
                >
                  <Text
                    style={{
                      color:
                        paymentMethod === "Transfer"
                          ? colors.tint
                          : colors.text,
                    }}
                  >
                    Transfer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    paymentMethod === "POS" && styles.methodSelected,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setPaymentMethod("POS")}
                >
                  <Text
                    style={{
                      color:
                        paymentMethod === "POS" ? colors.tint : colors.text,
                    }}
                  >
                    POS
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Notes (Optional)
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
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                placeholder="e.g., Reference number"
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.icon + "30" },
                ]}
                onPress={() => setIsPaymentModalVisible(false)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.accent }]}
                onPress={handleAddPayment}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.addPaymentButtonText}>
                    Confirm Payment
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  headerCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    // Platform-specific shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)", // Web equivalent
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    marginBottom: 8,
  },
  headerCustomer: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  headerSoldBy: {
    fontSize: 14,
    marginBottom: 4,
  },
  headerNotes: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  listContainer: {
    borderRadius: 12,
    overflow: "hidden",
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
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemSku: {
    fontSize: 12,
  },
  itemQuantityPrice: {
    width: 100,
    alignItems: "flex-end",
    marginHorizontal: 8,
  },
  itemSubtotal: {
    width: 80,
    alignItems: "flex-end",
  },
  itemText: {
    fontSize: 14,
  },
  summaryCard: {
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  balanceRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  balanceLabel: {
    fontWeight: "bold",
  },
  balanceValue: {
    fontWeight: "bold",
    fontSize: 18,
  },
  addPaymentButton: {
    height: 45,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  addPaymentButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  paymentHistoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
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
  methodSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  methodButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  methodSelected: {
    backgroundColor: Colors.light.tint + "20",
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
