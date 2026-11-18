import type { JSX } from "@solidjs/web";

export type TextInputElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Invokes a Solid `onInput` handler, supporting both standard functions
 * and Solid bound event handler tuples (`[handler, data]`).
 */
export function invokeTextInputHandler<T extends TextInputElement>(
  handler: JSX.InputEventHandlerUnion<T, InputEvent> | undefined,
  event: Parameters<JSX.InputEventHandler<T, InputEvent>>[0],
): void {
  if (typeof handler === "function") {
    handler(event);
  } else if (Array.isArray(handler) && typeof handler[0] === "function") {
    handler[0](handler[1], event);
  }
}

/**
 * Preserves the active text input's selection range across controlled DOM value
 * reconciliation (e.g. when a parent rejects invalid characters or formats text).
 */
export function restoreTextSelectionRange(
  el: TextInputElement,
  prevStart: number | null,
  prevEnd: number | null,
  prevLength: number,
  nextLength: number,
): void {
  if (prevStart === null || prevEnd === null || document.activeElement !== el) {
    return;
  }
  const delta = nextLength - prevLength;
  const nextStart = Math.max(0, Math.min(nextLength, prevStart + delta));
  const nextEnd = Math.max(0, Math.min(nextLength, prevEnd + delta));
  try {
    el.setSelectionRange(nextStart, nextEnd);
  } catch {
    // Input types like "email" or "number" do not support setSelectionRange.
  }
}
