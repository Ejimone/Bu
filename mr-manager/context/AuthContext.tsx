import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, UserRole, DEFAULT_PERMISSIONS } from "../models/User";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Sample users for demo
const DEMO_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123", // In a real app, this would be securely hashed
    displayName: "Admin User",
    role: "ADMIN",
    permissions: DEFAULT_PERMISSIONS.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    username: "sales",
    password: "sales123", // In a real app, this would be securely hashed
    displayName: "Sales Staff",
    role: "SALESMAN",
    permissions: DEFAULT_PERMISSIONS.SALESMAN,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const AUTH_STORAGE_KEY = "@InventoryApp:AuthUser";

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          // Rehydrate Date objects
          parsedUser.createdAt = new Date(parsedUser.createdAt);
          parsedUser.updatedAt = new Date(parsedUser.updatedAt);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Failed to load user from storage", error);
        setUser(null);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY); // Clear corrupted data
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    // In a real app, this would make an API call to your backend
    const foundUser = DEMO_USERS.find(
      (u) => u.username === username && u.password === password // Still using demo users for login check
    );

    if (foundUser) {
      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
        setUser(foundUser);
        return true;
      } catch (error) {
        console.error("Failed to save user to storage", error);
        return false;
      }
    }
    return false;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error("Failed to remove user from storage", error);
      // Still log the user out of the app state even if storage fails
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
