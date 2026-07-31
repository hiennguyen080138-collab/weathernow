/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0E1826",
          light: "#152238",
        },
        slate: {
          surface: "#1C2A40",
          border: "#2C3E58",
        },
        cloud: "#F3F6F9",
        mist: "#93A5BC",
        amber: {
          DEFAULT: "#E8A33D",
          soft: "#F4C878",
        },
        signal: "#49C6B9",
        rain: "#5B8DEF",
        warn: "#E2685A",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        data: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(4, 10, 20, 0.45)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateX(0px)" },
          "50%": { transform: "translateX(14px)" },
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 8s ease-in-out infinite",
        rise: "rise 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};