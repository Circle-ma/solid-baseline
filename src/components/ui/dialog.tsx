import { Dialog as ArkDialog, useDialogContext } from "@ark-ui/solid/dialog";
import { type ComponentProps, isServer, type JSX, Portal as SolidPortal } from "@solidjs/web";
import { omit, type ParentComponent, Show } from "solid-js";
import { type ButtonVariant, button, dialog } from "styled-system/recipes";
import { Icon } from "./icon";

const dialogStyles = dialog();

/**
 * Serializes Solid 2.0 `ClassValue` (strings, nested arrays, and conditional objects)
 * into a flat space-separated string for `@ark-ui/solid@5.x` / `@zag-js/core`, whose
 * `mergeProps` calls `str?.trim?.()` and silently drops non-string `class` values.
 */
function serializeArkClass(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(serializeArkClass).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    const classes: string[] = [];
    for (const [key, active] of Object.entries(value as Record<string, unknown>)) {
      if (active) classes.push(key);
    }
    return classes.join(" ");
  }
  return "";
}

export const DialogRoot: ParentComponent<Omit<ComponentProps<typeof ArkDialog.Root>, "style">> = (
  props,
) => {
  const rest = omit(props, "children");
  return <ArkDialog.Root {...rest}>{props.children}</ArkDialog.Root>;
};

export interface DialogTriggerProps
  extends Omit<ComponentProps<typeof ArkDialog.Trigger>, "style"> {
  variant?: ButtonVariant["variant"];
  size?: ButtonVariant["size"];
}

export const DialogTrigger: ParentComponent<DialogTriggerProps> = (props) => {
  const rest = omit(props, "variant", "size", "class", "children");
  return (
    <ArkDialog.Trigger
      {...rest}
      class={serializeArkClass([
        props.variant || props.size
          ? button({ variant: props.variant, size: props.size })
          : undefined,
        props.class,
      ])}
    >
      {props.children}
    </ArkDialog.Trigger>
  );
};

export const DialogBackdrop: ParentComponent<
  Omit<ComponentProps<typeof ArkDialog.Backdrop>, "style">
> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <ArkDialog.Backdrop {...rest} class={serializeArkClass([dialogStyles.backdrop, props.class])}>
      {props.children}
    </ArkDialog.Backdrop>
  );
};

export const DialogPositioner: ParentComponent<
  Omit<ComponentProps<typeof ArkDialog.Positioner>, "style">
> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <ArkDialog.Positioner
      {...rest}
      class={serializeArkClass([dialogStyles.positioner, props.class])}
    >
      {props.children}
    </ArkDialog.Positioner>
  );
};

export const DialogContent: ParentComponent<
  Omit<ComponentProps<typeof ArkDialog.Content>, "style">
> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <ArkDialog.Content {...rest} class={serializeArkClass([dialogStyles.content, props.class])}>
      {props.children}
    </ArkDialog.Content>
  );
};

export type DialogCloseTriggerProps = Omit<
  ComponentProps<typeof ArkDialog.CloseTrigger>,
  "style" | "asChild"
> & {
  asChild?: (
    props: (userProps?: ComponentProps<"button">) => Omit<ComponentProps<"button">, "style">,
  ) => JSX.Element;
};

/**
 * Pure, unstyled Ark UI Dialog close trigger.
 * Compose with `<Button>` via `asChild={(props) => <Button {...props()} ...>...</Button>}`,
 * or use `<Dialog.CloseButton />` for the canonical top-right close icon button.
 */
export const DialogCloseTrigger: ParentComponent<DialogCloseTriggerProps> = (props) => {
  const rest = omit(props, "class", "children", "asChild");

  return (
    <ArkDialog.CloseTrigger
      {...rest}
      asChild={props.asChild as ComponentProps<typeof ArkDialog.CloseTrigger>["asChild"]}
      class={props.class ? serializeArkClass(props.class) : undefined}
    >
      {props.asChild ? undefined : props.children}
    </ArkDialog.CloseTrigger>
  );
};

export type DialogCloseButtonProps = Omit<ComponentProps<typeof ArkDialog.CloseTrigger>, "style">;

/**
 * Canonical top-right icon close button for `<Dialog.Content>`.
 * Renders the `dialog__closeTrigger` slot recipe with a default close `<Icon>`.
 */
export const DialogCloseButton: ParentComponent<DialogCloseButtonProps> = (props) => {
  const rest = omit(props, "class", "children", "aria-label");

  return (
    <ArkDialog.CloseTrigger
      {...rest}
      class={serializeArkClass([dialogStyles.closeTrigger, props.class])}
      aria-label={props["aria-label"] ?? "Close dialog"}
    >
      {props.children ?? (
        <Icon size="sm" viewBox="0 0 15 15" stroke-width="1.75">
          <path d="M11.5 3.5L3.5 11.5M3.5 3.5L11.5 11.5" />
        </Icon>
      )}
    </ArkDialog.CloseTrigger>
  );
};

export const DialogHeader: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div {...rest} class={[dialogStyles.header, props.class]}>
      {props.children}
    </div>
  );
};

export const DialogTitle: ParentComponent<Omit<ComponentProps<typeof ArkDialog.Title>, "style">> = (
  props,
) => {
  const rest = omit(props, "class", "children");
  return (
    <ArkDialog.Title {...rest} class={serializeArkClass([dialogStyles.title, props.class])}>
      {props.children}
    </ArkDialog.Title>
  );
};

export const DialogDescription: ParentComponent<
  Omit<ComponentProps<typeof ArkDialog.Description>, "style">
> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <ArkDialog.Description
      {...rest}
      class={serializeArkClass([dialogStyles.description, props.class])}
    >
      {props.children}
    </ArkDialog.Description>
  );
};

export const DialogBody: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div {...rest} class={[dialogStyles.body, props.class]}>
      {props.children}
    </div>
  );
};

export const DialogFooter: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div {...rest} class={[dialogStyles.footer, props.class]}>
      {props.children}
    </div>
  );
};

export type DialogPortalProps = ComponentProps<typeof SolidPortal>;

export const DialogPortal: ParentComponent<DialogPortalProps> = (props) => {
  const dialogContext = useDialogContext();
  return (
    <Show when={!isServer && dialogContext().open}>
      <SolidPortal {...props}>{props.children}</SolidPortal>
    </Show>
  );
};

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Backdrop: DialogBackdrop,
  Positioner: DialogPositioner,
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Body: DialogBody,
  Footer: DialogFooter,
  CloseTrigger: DialogCloseTrigger,
  CloseButton: DialogCloseButton,
};

export default Dialog;
