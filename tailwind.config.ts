import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors:{
        'kiwi-green':'#78C850',
        'kiwi-dark':'#3E5C2F',
        'kiwi-light':'#F0F5EC',
        'kiwi-gray':'#4A5568',
        'kiwi-black':'#1A202C'
      },
      fontFamily:{
        heading:['Space Grotesk','sans-serif'],
        body:['Inter','sans-serif']
      }
    }
  },
  plugins: [],
} satisfies Config
