/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["*.{html,js}"],
  plugins: [require("daisyui")],
  daisyui: {
    styled: true,
    themes: true,
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: "",
    darkTheme: "dark",
    themes: ["dark", "garden"],
  }
}

