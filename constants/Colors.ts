/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#4A90E2";
const tintColorDark = "#63B3ED";

export const Colors = {
  light: {
    // Primary colors
    text: "#2D3748",
    background: "#F7F9FC",
    tint: tintColorLight,

    // UI elements
    primary: "#4A90E2",
    secondary: "#718096",
    accent: "#2196F3",

    // Cards and surfaces
    surface: "#FFFFFF",
    card: "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.6)",

    // Borders and separators
    border: "#EDF2F7",
    separator: "#E2E8F0",

    // Icons
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,

    // Text variations
    textPrimary: "#2D3748",
    textSecondary: "#4A5568",
    textTertiary: "#718096",
    textMuted: "#A0AEC0",

    // Status colors
    success: "#48BB78",
    error: "#E53E3E",
    warning: "#ED8936",
    info: "#4299E1",

    // Prayer times specific
    prayerTime: "#2D3748",
    nextPrayer: "#4A90E2",
    activePrayer: "#2196F3",

    // Sections
    sectionBackground: "#F7F9FC",
    sectionHeader: "#4A90E2",

    // Shadows
    shadow: "#4A5568",
    shadowColor: "rgba(74, 85, 104, 0.1)",
  },
  dark: {
    // Primary colors
    text: "#E2E8F0",
    background: "#1A202C",
    tint: tintColorDark,

    // UI elements
    primary: "#63B3ED",
    secondary: "#A0AEC0",
    accent: "#4299E1",

    // Cards and surfaces
    surface: "#2D3748",
    card: "#2D3748",
    overlay: "rgba(0, 0, 0, 0.8)",

    // Borders and separators
    border: "#4A5568",
    separator: "#4A5568",

    // Icons
    icon: "#A0AEC0",
    tabIconDefault: "#A0AEC0",
    tabIconSelected: tintColorDark,

    // Text variations
    textPrimary: "#E2E8F0",
    textSecondary: "#CBD5E0",
    textTertiary: "#A0AEC0",
    textMuted: "#718096",

    // Status colors
    success: "#68D391",
    error: "#FC8181",
    warning: "#F6AD55",
    info: "#63B3ED",

    // Prayer times specific
    prayerTime: "#E2E8F0",
    nextPrayer: "#63B3ED",
    activePrayer: "#4299E1",

    // Sections
    sectionBackground: "#1A202C",
    sectionHeader: "#63B3ED",

    // Shadows
    shadow: "#000000",
    shadowColor: "rgba(0, 0, 0, 0.3)",
  },
};
