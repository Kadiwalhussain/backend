/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#34d399",
          ink: "#052e1f",
          soft: "#d1fae5",
        },
      },
      boxShadow: {
        soft: "0 12px 36px -18px rgba(15, 23, 42, 0.5)",
      },
    },
  },
  plugins: [],
};

