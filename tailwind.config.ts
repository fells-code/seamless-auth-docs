import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6B21A8", // Deep purple
          light: "#A855F7",
          dark: "#4C1D95",
        },
        background: "#0F172A", // Dark background
        accent: "#9333EA",
      },
    },
  },
  plugins: [],
};

export default config;
