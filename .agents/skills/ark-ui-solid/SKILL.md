---

name: ark-ui-solid
description: Guide for building accessible UI components with Ark UI Solid (@ark-ui/solid) and Panda CSS 2.5 slot recipes in Solid.js 2.0. Read when building or refactoring UI components, dialogs, menus, selects, or forms.
---

# Ark UI Solid & Panda CSS 2.5 Best Practices

Ark UI provides headless, accessible component primitives powered by Zag.js state machines.
This starter pairs Ark UI (`@ark-ui/solid@^5.39.3`) with native Panda CSS 2.5 design tokens and slot recipes defined in `panda.config.ts`.

## 1. Golden Rules for Ark UI Solid

### Rule 1: Presence-Aware `<Dialog.Portal>` Lifecycle (Preserve Exit Animations)

Never gate `<Portal>` on `dialogContext().open`: doing so unmounts the Portal immediately on dismissal and turns `overlayFadeOut` / `dialogScaleOut` CSS exit animations into dead code.

Instead, `<Dialog.Portal>` binds to Ark UI's presence state machine (`usePresenceContext()` from `@ark-ui/solid/presence`) while `<Dialog.Root>` defaults `lazyMount` and `unmountOnExit` to `true`:

```tsx
export const DialogPortal: ParentComponent<DialogPortalProps> = (props) => {
  const presence = usePresenceContext();
  return (
    <Show when={!isServer && (presence().present || !presence().unmounted)}>
      <SolidPortal {...props}>{props.children}</SolidPortal>
    </Show>
  );
};
```

And inside `DialogBackdrop`, `DialogPositioner`, and `DialogContent`, bind `useDialogContext()` + `usePresenceContext()` onto native `<div>` elements with `untrack(() => presence().ref)` so the DOM node stays stable throughout the `"open" -> "closed"` transition and unmounts cleanly on `animationend`:

```tsx
<Dialog.Root>
  <Dialog.Trigger variant="outline">Open Dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content>
        <Dialog.CloseButton />
        <Dialog.Header>
          <Dialog.Title>Dialog Header</Dialog.Title>
          <Dialog.Description>Dialog subtitle context</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>Dialog Content Details</Dialog.Body>
        <Dialog.Footer>
          <Dialog.CloseTrigger
            asChild={(props) => (
              <Button {...props()} variant="outline" size="sm">
                Cancel
              </Button>
            )}
          />
          <Dialog.CloseTrigger
            asChild={(props) => (
              <Button {...props()} variant="solid" size="sm">
                Confirm
              </Button>
            )}
          />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Portal>
</Dialog.Root>;
```

_Why?_ Zag.js handles the state machine (Escape key, focus trap & restoration, ARIA attributes, and CSS exit animation tracking), while `presence().present` / `presence().unmounted` ensures exit animations play to completion before complete DOM teardown.

### Rule 2: DO NOT Use `asChild` as a Boolean Flag

In React / Radix libraries, `asChild` is commonly used as a boolean flag:

```tsx
// ❌ WRONG (React pattern - will crash in Ark UI Solid with TypeError: localProps.asChild is not a function)
<Dialog.Trigger asChild>
  <button type="button">Open</button>
</Dialog.Trigger>;
```

In **Ark UI Solid**, `asChild` expects a **Render Prop function**:

```tsx
// ✅ RIGHT: Direct typesafe variants on framework primitives
<Dialog.Trigger variant="outline">Open Dialog</Dialog.Trigger>;

// ✅ RIGHT: Custom rendering via render prop
<Dialog.Trigger
  asChild={(props) => (
    <Button variant="outline" {...props()}>
      Custom Button
    </Button>
  )}
/>;
```

### Rule 3: Import `<Portal>` from `@solidjs/web`

In Solid 2.0, DOM utilities and `<Portal>` reside in `@solidjs/web`:

```tsx
import { Portal } from "@solidjs/web";
```

### Rule 4: Use Controlled and Uncontrolled Modals Idiomatically

Ark UI components are self-managing by default via Zag.js state machines:

```tsx
// Uncontrolled (recommended when external state sync is not required):
<Dialog.Root defaultOpen={false}>
  <Dialog.Trigger variant="solid">Open</Dialog.Trigger>
  ...
</Dialog.Root>;

// Controlled (when synced to an external Solid signal):
const [open, setOpen] = createSignal(false);

<Dialog.Root open={open()} onOpenChange={(e) => setOpen(e.open)}>
  <Dialog.Trigger variant="solid">Open</Dialog.Trigger>
  ...
</Dialog.Root>;
```

## 2. Panda CSS 2.5 Slot Recipe Anatomy

Panda CSS 2.5 slot recipes generate typed slot classnames in `styled-system/recipes`.
When a slot recipe has variants (such as `card` with `variant` and `density`), compute `card({ variant: props.variant, density: props.density })` inside a `createMemo` and share it across descendant slots via Solid 2.0 `createContext` rather than calling `card()` once at module top level.

## 3. Temporary Solid 2.0 Bridge & Freeze Policy

This baseline runs `@ark-ui/solid@5.x` on Solid 2.0.0 through the minimal `patches/solid-js@2.0.0.patch` compatibility bridge:

- **Honest Upstream Timeline**: Do not assume the initial Ark UI v6.0 release automatically includes native Solid 2.0 support (Ark UI v6 prioritizes Zag v2 stabilization with Solid 2.0 support still under evaluation, and plans to deprecate `asChild` in favor of a `render` prop).
- **Freeze Policy**: Until `@zag-js/solid` 2.x and `@ark-ui/solid` officially ship native Solid 2.0 support, do **not** expand `patches/solid-js@2.0.0.patch` to wrap additional Ark UI widgets — keep only the diagnostics-verified `<Dialog>` as the reference template.
- **Zero-Residue Cleanup**: Once native upstream support ships, execute the 4-step **Zero-Residue Upstream Upgrade Checklist** in `AGENTS.md` (remove patch & `patchedDependencies`, drop `serializeArkClass` in `dialog.tsx` and migrate `asChild` -> `render`, update `scripts/check-rails.ts` Rule #14 wording, and remove bridge notes from `AGENTS.md`, `README.md`, and this skill).
