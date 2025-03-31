export type UserRole = "ADMIN" | "SALESMAN";

export interface UserPermissions {
  canManageProducts: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canMakeSales: boolean;
  canViewInventory: boolean;
  canAdjustInventory: boolean;
  canViewSales: boolean;
}

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  ADMIN: {
    canManageProducts: true,
    canViewReports: true,
    canManageUsers: true,
    canMakeSales: true,
    canViewInventory: true,
    canAdjustInventory: true,
    canViewSales: true,
  },
  SALESMAN: {
    canManageProducts: false,
    canViewReports: false,
    canManageUsers: false,
    canMakeSales: true,
    canViewInventory: true,
    canAdjustInventory: false,
    canViewSales: true,
  },
};

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be hashed
  displayName: string;
  role: UserRole;
  permissions: UserPermissions;
  createdAt: Date;
  updatedAt: Date;
}
