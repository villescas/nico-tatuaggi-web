/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                'tattoo-black': '#050505',
                'tattoo-gold': '#d4af37',
                'tattoo-silver': '#c0c0c0',
            },
        },
    },
    plugins: [],
};