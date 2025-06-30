# shadcn/ui Setup for AdonisJS 6 + React + Inertia

This document outlines the shadcn/ui integration that has been set up in your AdonisJS project.

## What was installed

### Dependencies

- `tailwindcss` - CSS framework
- `postcss` - CSS processing
- `autoprefixer` - CSS vendor prefixing
- `tailwindcss-animate` - Animation utilities for Tailwind
- `class-variance-authority` - For building variant-based component APIs
- `clsx` - Utility for constructing className strings
- `tailwind-merge` - Utility for merging Tailwind CSS classes
- `@radix-ui/react-slot` - Primitive for building composable component APIs

### Files Created/Modified

- `tailwind.config.js` - TailwindCSS configuration with shadcn/ui theme
- `postcss.config.js` - PostCSS configuration
- `inertia/css/app.css` - Updated with TailwindCSS directives and CSS variables
- `inertia/lib/utils.ts` - Utility functions for class merging
- `components.json` - shadcn/ui configuration file
- `inertia/components/ui/button.tsx` - First shadcn/ui component
- `inertia/pages/home.tsx` - Updated to demo the Button component

## How to add more components

Use the shadcn CLI to add components:

```bash
npx shadcn@latest add [component-name]
```

For example:

```bash
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

## Usage

Import components from the `ui` directory:

```tsx
import { Button } from '../components/ui/button'
// or
import { Button } from 'inertia/components/ui/button' // if using path mapping

function MyComponent() {
  return (
    <div>
      <Button variant="default">Click me</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
    </div>
  )
}
```

## Available Button Variants

- `default` - Primary button style
- `secondary` - Secondary button style
- `destructive` - For dangerous actions
- `outline` - Outlined button
- `ghost` - Minimal button style
- `link` - Link-styled button

## Available Button Sizes

- `sm` - Small button
- `default` - Default size
- `lg` - Large button
- `icon` - Icon-only button

## Dark Mode Support

The setup includes dark mode support. Toggle dark mode by adding/removing the `dark` class on the `html` element:

```tsx
// Enable dark mode
document.documentElement.classList.add('dark')

// Disable dark mode
document.documentElement.classList.remove('dark')
```

## Customization

You can customize the theme by modifying:

- CSS variables in `inertia/css/app.css`
- TailwindCSS configuration in `tailwind.config.js`
- Component variants in individual component files

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [Radix UI Documentation](https://radix-ui.com)
