import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          // AuthProvider and TabLayout effect will handle redirect to login
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Account
        </Text>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.icon }]}>
              Username:
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {user?.username}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.icon }]}>
              Display Name:
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {user?.displayName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: colors.icon }]}>Role:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {user?.role}
            </Text>
          </View>
        </View>
      </View>

      {/* Placeholder for User Management (Admin only) */}
      {user?.role === "ADMIN" && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            User Management
          </Text>
          <TouchableOpacity
            style={[
              styles.card,
              styles.actionRow,
              { backgroundColor: colors.cardBackground },
            ]}
            // onPress={() => router.push('/settings/users')} // Future navigation
          >
            <IconSymbol name="person.2.fill" size={20} color={colors.icon} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Manage Users
            </Text>
            <IconSymbol
              name="chevron.right"
              size={16}
              color={colors.icon}
              style={styles.chevron}
            />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Actions
        </Text>
        <TouchableOpacity
          style={[
            styles.card,
            styles.actionRow,
            { backgroundColor: colors.cardBackground },
          ]}
          onPress={handleLogout}
        >
          <IconSymbol
            name="rectangle.portrait.and.arrow.right.fill"
            size={20}
            color={"#E74C3C"}
          />
          <Text style={[styles.actionText, { color: "#E74C3C" }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Info Section */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.icon }]}>
          Inventory Manager App
        </Text>
        <Text style={[styles.footerText, { color: colors.icon }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#687076",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 12,
    padding: 16,
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18, // Make rows slightly taller
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
  },
  chevron: {
    marginLeft: 8,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    paddingBottom: 40,
    marginHorizontal: 16,
    borderTopWidth: 1,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
