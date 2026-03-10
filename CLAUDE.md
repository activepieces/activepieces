# Activepieces — Coding Rules

## File Structure

- **Exported types and constants must be placed at the end of the file**, after all logic (functions, hooks, components, classes, etc.). This keeps the logic front and centre when reading a file, and groups the public contract at a predictable location.

  ```ts
  // ✅ Correct
  function doSomething() { ... }

  export const MY_CONST = 'value';
  export type MyType = { ... };
  // ✅ Correct
  const businessService = () => { ... }

  export const MY_CONST = 'value';
  export type MyType = { ... };
  
  // ❌ Wrong — types/consts mixed in before logic
  export const MY_CONST = 'value';
  export type MyType = { ... };
  function doSomething() { ... }
  ```
