/**
 * Vitest / HappyDOM Spec-Compliance Setup
 *
 * happy-dom@21.0.4 checks `if (textContent)` instead of WebIDL string coercion
 * in `Element.prototype.textContent`, so assigning numeric `0` removes children
 * without creating a `"0"` TextNode. Normalize non-nullish values to strings per DOM spec.
 */
const textContentDesc =
  typeof Element !== "undefined"
    ? Object.getOwnPropertyDescriptor(Element.prototype, "textContent")
    : undefined;

if (textContentDesc?.set && textContentDesc.configurable) {
  const originalSet = textContentDesc.set;
  Object.defineProperty(Element.prototype, "textContent", {
    ...textContentDesc,
    set(value: unknown) {
      originalSet.call(this, value === null || value === undefined ? "" : String(value));
    },
  });
}
