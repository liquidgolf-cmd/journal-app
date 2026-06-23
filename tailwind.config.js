/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1A1A",
        paper: "#F5EFE3",
        card: "#EFE3CB",
        amber: "#C7943C",
        amberlight: "#E0B468",
      },
    },
  },
  plugins: [],
};
