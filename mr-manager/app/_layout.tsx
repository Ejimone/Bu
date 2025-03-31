import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProductsProvider } from "@/context/ProductsContext";
import { SalesProvider } from "@/context/SalesContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth(); // Get loading state

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    // Hide splash screen once fonts are loaded AND auth state is determined
    if (loaded && !isAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isAuthLoading]);

  // Don't render anything until fonts are loaded and auth state is known
  if (!loaded || isAuthLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* The main app tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Login screen, presented modally */}
        <Stack.Screen
          name="login"
          options={{
            presentation: "modal",
            headerShown: false,
            // Redirect authenticated users away from login
            // Note: This might not be strictly necessary if TabLayout handles it,
            // but provides an extra layer.
            // redirect: isAuthenticated ? '/(tabs)' : false,
          }}
        />
        {/* Add/Edit Product screens */}
        <Stack.Screen name="product/add" options={{ title: "Add Product" }} />
        <Stack.Screen
          name="product/edit/[id]"
          options={{ title: "Edit Product" }}
        />
        {/* New/Detail Sale screens */}
        <Stack.Screen name="sales/new" options={{ title: "New Sale" }} />
        <Stack.Screen
          name="sales/detail/[id]"
          options={{ title: "Sale Details" }}
        />
        {/* Not found screen */}
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <SalesProvider>
          <RootLayoutNav />
        </SalesProvider>
      </ProductsProvider>
    </AuthProvider>
  );
}
