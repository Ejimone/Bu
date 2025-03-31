/**
 * Color scheme for the inventory management app
 */

// Main color palette based on style guide
const PRIMARY = "#2C3E50"; // Navy blue
const SECONDARY = "#27AE60"; // Success green
const WARNING = "#E67E22"; // Orange
const BACKGROUND = "#F5F8FA"; // Light grey
const TEXT = "#34495E"; // Dark grey
const ACCENT = "#3498DB"; // Blue

export const Colors = {
  light: {
    text: TEXT,
    background: BACKGROUND,
    tint: PRIMARY,
    success: SECONDARY,
    warning: WARNING,
    accent: ACCENT,
    icon: TEXT,
    tabIconDefault: "#687076",
    tabIconSelected: PRIMARY,
    cardBackground: "#FFFFFF",
    border: "#E1E8ED",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: ACCENT,
    success: SECONDARY,
    warning: WARNING,
    accent: ACCENT,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: ACCENT,
    cardBackground: "#1E2428",
    border: "#38444D",
  },
};
