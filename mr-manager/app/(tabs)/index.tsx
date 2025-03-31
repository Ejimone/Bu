import React from "react";
import {
  StyleSheet,
  Platform,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "expo-router";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useSales } from "@/context/SalesContext";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const navigation = useNavigation();

  const { user } = useAuth();
  const { products, getLowStockProducts } = useProducts();
  const { sales, getTotalSales, getTodaySales, getCreditSales } = useSales();

  const lowStockItems = getLowStockProducts();
  const todaySales = getTodaySales();
  const creditSales = getCreditSales();

  // Calculate total inventory value
  const inventoryValue = products.reduce((total, product) => {
    return total + product.costPrice * product.stockLevel;
  }, 0);

  // Calculate today's revenue
  const todaysRevenue = todaySales.reduce((total, sale) => {
    return total + sale.totalAmount;
  }, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.welcomeSection}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>
          Welcome, {user?.displayName || "User"}
        </Text>
        <Text style={[styles.dateText, { color: colors.icon }]}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View
          style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.accent + "20" },
            ]}
          >
            <IconSymbol size={24} name="cube.box.fill" color={colors.accent} />
          </View>
          <Text style={[styles.statTitle, { color: colors.icon }]}>
            Total Products
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {products.length}
          </Text>
        </View>

        <View
          style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.success + "20" },
            ]}
          >
            <IconSymbol size={24} name="cart.fill" color={colors.success} />
          </View>
          <Text style={[styles.statTitle, { color: colors.icon }]}>
            Today's Sales
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            ₦{todaysRevenue.toLocaleString()}
          </Text>
        </View>

        <View
          style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.tint + "20" },
            ]}
          >
            <IconSymbol size={24} name="creditcard.fill" color={colors.tint} />
          </View>
          <Text style={[styles.statTitle, { color: colors.icon }]}>
            Credit Sales
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {creditSales.length}
          </Text>
        </View>

        <View
          style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.warning + "20" },
            ]}
          >
            <IconSymbol
              size={24}
              name="exclamationmark.triangle.fill"
              color={colors.warning}
            />
          </View>
          <Text style={[styles.statTitle, { color: colors.icon }]}>
            Low Stock Items
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {lowStockItems.length}
          </Text>
        </View>
      </View>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Low Stock Alerts
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("inventory")}>
              <Text style={[styles.sectionAction, { color: colors.accent }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.alertsContainer,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            {lowStockItems.slice(0, 3).map((item) => (
              <View
                key={item.id}
                style={[styles.alertItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.alertItemContent}>
                  <Text style={[styles.alertItemName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.alertItemDetail, { color: colors.icon }]}
                  >
                    SKU: {item.sku || "N/A"}
                  </Text>
                </View>
                <View style={styles.alertItemRight}>
                  <Text
                    style={[
                      styles.stockCount,
                      {
                        color:
                          item.stockLevel <= item.reorderPoint
                            ? "#E74C3C"
                            : colors.warning,
                        backgroundColor:
                          item.stockLevel <= item.reorderPoint
                            ? "#E74C3C20"
                            : colors.warning + "20",
                      },
                    ]}
                  >
                    {item.stockLevel} left
                  </Text>
                </View>
              </View>
            ))}

            {lowStockItems.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate("inventory")}
              >
                <Text style={{ color: colors.accent }}>
                  View {lowStockItems.length - 3} more items
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Recent Sales */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Sales
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("sales")}>
            <Text style={[styles.sectionAction, { color: colors.accent }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.alertsContainer,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          {todaySales.length > 0 ? (
            todaySales.slice(0, 3).map((sale) => (
              <View
                key={sale.id}
                style={[styles.alertItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.alertItemContent}>
                  <Text style={[styles.alertItemName, { color: colors.text }]}>
                    {sale.customer?.name || "Walk-in Customer"}
                  </Text>
                  <Text
                    style={[styles.alertItemDetail, { color: colors.icon }]}
                  >
                    {sale.items.length}{" "}
                    {sale.items.length === 1 ? "item" : "items"} •
                    {new Date(sale.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.alertItemRight}>
                  <Text style={[styles.saleAmount, { color: colors.text }]}>
                    ₦{sale.totalAmount.toLocaleString()}
                  </Text>
                  <View style={styles.paymentStatusContainer}>
                    <View
                      style={[
                        styles.paymentStatusDot,
                        {
                          backgroundColor:
                            sale.paymentStatus === "PAID"
                              ? colors.success
                              : sale.paymentStatus === "PARTIAL"
                              ? colors.warning
                              : "#E74C3C",
                        },
                      ]}
                    />
                    <Text
                      style={[styles.paymentStatusText, { color: colors.icon }]}
                    >
                      {sale.paymentStatus}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.icon }]}>
                No sales today
              </Text>
            </View>
          )}

          {todaySales.length > 3 && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => navigation.navigate("sales")}
            >
              <Text style={{ color: colors.accent }}>
                View {todaySales.length - 3} more sales
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={() => navigation.navigate("sales", { screen: "new" })}
          >
            <IconSymbol
              size={28}
              name="cart.badge.plus"
              color={colors.accent}
            />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              New Sale
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={() => navigation.navigate("inventory", { screen: "add" })}
          >
            <IconSymbol size={28} name="plus.square" color={colors.success} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              Add Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={() =>
              navigation.navigate("inventory", { screen: "adjust" })
            }
          >
            <IconSymbol
              size={28}
              name="arrow.left.arrow.right"
              color={colors.warning}
            />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              Adjust Stock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={() => navigation.navigate("reports")}
          >
            <IconSymbol size={28} name="doc.text.fill" color={colors.tint} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              Generate Report
            </Text>
          </TouchableOpacity>
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
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    marginBottom: 24,
  },
  statCard: {
    width: "45%",
    margin: "2.5%",
    borderRadius: 12,
    padding: 16,
    // Platform-specific shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.05)", // Web equivalent
      },
    }),
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionAction: {
    fontSize: 14,
  },
  alertsContainer: {
    borderRadius: 12,
    overflow: "hidden",
    // Platform-specific shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.05)", // Web equivalent
      },
    }),
  },
  alertItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  alertItemContent: {
    flex: 1,
  },
  alertItemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  alertItemDetail: {
    fontSize: 14,
  },
  alertItemRight: {
    alignItems: "flex-end",
  },
  stockCount: {
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: "600",
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
  },
  viewMoreButton: {
    padding: 12,
    alignItems: "center",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  quickActionButton: {
    width: "45%",
    margin: "2.5%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    height: 100,
    justifyContent: "center",
    // Platform-specific shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.05)", // Web equivalent
      },
    }),
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
