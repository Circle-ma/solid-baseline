---

name: ark-ui-solid
description: Guide for building accessible UI components with Ark UI Solid (@ark-ui/solid) and Park UI in Solid.js 2.0. Read when building or refactoring UI components, dialogs, menus, selects, or forms.
---

# Ark UI Solid & Park UI Best Practices

Ark UI provides headless, accessible component primitives powered by Zag.js state machines.
Park UI pairs Ark UI with Panda CSS design tokens and slot recipes.

## 1. Golden Rules for Ark UI Solid

### Rule 1: Autonomous Lifecycle via Encapsulated `<Dialog.Portal>`

In this framework, `<Dialog.Portal>` internally binds to Ark UI's `useDialogContext()` and `<Show when={dialog().open}>`:
```tsx
<Dialog.Root lazyMount unmountOnExit>
  <Dialog.Trigger class={button({ variant: "outline" })}>Open Dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop class={classes.backdrop} />
    <Dialog.Positioner class={classes.positioner}>
      <Dialog.Content class={classes.content}>
        <Dialog.CloseTrigger />
        <Dialog.Header>
          <Dialog.Title>Dialog Header</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>Dialog Content Details</Dialog.Body>
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Portal>
</Dialog.Root>;
```
_Why?_ Zag.js handles the state machine (ESC keys, focus restoration, ARIA attributes), while `<Dialog.Portal>` ensures total DOM removal upon closing without requiring manual `const [isOpen, setIsOpen]` signal boilerplate.

### Rule 2: DO NOT Use `asChild` as a Boolean Flag

In React / Radix libraries, `asChild` is commonly used as a boolean flag:
```tsx
// ❌ WRONG (React pattern - will crash in Ark UI Solid with TypeError: localProps.asChild is not a function)
<Dialog.Trigger asChild>
  <button type="button">Open</button>
</Dialog.Trigger>;
```

In **Ark UI Solid**, Ark components are already polymorphic DOM elements (`ark.button`, `ark.div`, etc.).
Style them directly with Panda CSS or Park UI recipes:
```tsx
// ✅ RIGHT: Direct styling on Ark UI primitives
import { button } from "styled-system/recipes";

<Dialog.Trigger class={button({ variant: "outline" })}>Open Dialog</Dialog.Trigger>;
```

If you truly need custom rendering, `asChild` in Solid expects a **Render Prop function**:
```tsx
// ✅ RIGHT (if using asChild, pass a function)
<Dialog.Trigger
  asChild={(props) => (
    <button {...props()} class={button({ variant: "outline" })}>
      Custom Button
    </button>
  )}
/>;
```

### Rule 2: Import `<Portal>` from `@solidjs/web`

In Solid 2.0, DOM utilities and `<Portal>` reside in `@solidjs/web`:
```tsx
import { Portal } from "@solidjs/web";
```

### Rule 3: Use Controlled and Uncontrolled Modals Idiomatically

Ark UI components are self-managing by default via Zag.js state machines.
```tsx
// Uncontrolled (recommended when external state sync is not required):
<Dialog.Root defaultOpen={false}>
  <Dialog.Trigger class={button({ variant: "solid" })}>Open</Dialog.Trigger>
  ...
</Dialog.Root>;

// Controlled (when synced to an external Solid signal):
const [open, setOpen] = createSignal(false);

<Dialog.Root open={open()} onOpenChange={(e) => setOpen(e.open)}>
  <Dialog.Trigger class={button({ variant: "solid" })}>Open</Dialog.Trigger>
  ...
</Dialog.Root>;
```

## 2. Park UI Slot Recipe Anatomy

Park UI generates slot recipes for complex components in `styled-system/recipes`.
For example, a complete dialog:
```tsx
import { Dialog } from "@ark-ui/solid/dialog";
import { Portal } from "@solidjs/web";
import { dialog, button } from "styled-system/recipes";

export function CustomDialog() {
  const classes = dialog();

  return (
    <Dialog.Root>
      <Dialog.Trigger class={button({ variant: "outline" })}>Open Dialog</Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop class={classes.backdrop} />
        <Dialog.Positioner class={classes.positioner}>
          <Dialog.Content class={classes.content}>
            <Dialog.Title class={classes.title}>Dialog Title</Dialog.Title>
            <Dialog.Description class={classes.description}>
              Dialog body content goes here.
            </Dialog.Description>
            <Dialog.CloseTrigger class={button({ variant: "solid" })}>Close</Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
```
