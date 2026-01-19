/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'apple-red': '#FA233B',
                'apple-bg': '#F2F2F7',
                'apple-card': '#FFFFFF',
                'apple-gray': '#8E8E93',
                'apple-gray-light': '#E5E5EA',
            },
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
