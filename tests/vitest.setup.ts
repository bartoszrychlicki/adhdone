import "@testing-library/jest-dom/vitest"

// Provide a noop implementation for Next.js dynamic import tracking when running in Vitest.
Object.defineProperty(globalThis, "__next_dynamic__", {
  writable: true,
  value: { register: () => {} },
})
