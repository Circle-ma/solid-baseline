import { Dialog as ArkDialog, useDialogContext } from "@ark-ui/solid/dialog";
import { Portal as SolidPortal } from "@solidjs/web";
import type { ComponentProps, ParentComponent } from "solid-js";
import { omit, Show } from "solid-js";
import { css, cx } from "styled-system/css";
import { type ButtonVariant, button, dialog } from "styled-system/recipes";

/**
 * Root Dialog Component
 * Encapsulates headless state machine lifecycle from Zag.js / Ark UI.
 */
export const DialogRoot = ArkDialog.Root;

export interface DialogTriggerProps extends ComponentProps<typeof ArkDialog.Trigger> {
  variant?: ButtonVariant["variant"];
  size?: ButtonVariant["size"];
}

/**
 * Dialog Trigger Primitive
 * Polymorphic trigger supporting direct variant/size styling or asChild render props.
 */
export const DialogTrigger: ParentComponent<DialogTriggerProps> = (props) => {
  const rest = omit(props, "variant", "size", "class", "children");
  return (
    <ArkDialog.Trigger
      {...rest}
      class={cx(
        props.variant || props.size
          ? button({ variant: props.variant, size: props.size })
          : undefined,
        props.class as string,
      )}
    >
      {props.children}
    </ArkDialog.Trigger>
  );
};

/**
 * Backdrop overlay with blur and subtle theme tint.
 */
export const DialogBackdrop: ParentComponent<ComponentProps<typeof ArkDialog.Backdrop>> = (
  props,
) => {
  const rest = omit(props, "class", "children");
  const styles = dialog();
  return (
    <ArkDialog.Backdrop
      {...rest}
      class={cx(
        styles.backdrop,
        css({
          position: "fixed",
          inset: "0",
          zIndex: "overlay",
          backdropBlur: "sm",
          bg: { _light: "white.a10", _dark: "black.a10" },
        }),
        props.class as string,
      )}
    >
      {props.children}
    </ArkDialog.Backdrop>
  );
};

/**
 * Viewport Positioner
 * Centers modal horizontally and vertically with responsive viewport padding.
 */
export const DialogPositioner: ParentComponent<ComponentProps<typeof ArkDialog.Positioner>> = (
  props,
) => {
  const rest = omit(props, "class", "children");
  const styles = dialog();
  return (
    <ArkDialog.Positioner
      {...rest}
      class={cx(
        styles.positioner,
        css({
          position: "fixed",
          inset: "0",
          zIndex: "modal",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { base: "4", sm: "6" },
          overflowY: "auto",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </ArkDialog.Positioner>
  );
};

/**
 * Pre-composed, beautifully padded and constrained Dialog Content container.
 * Acts as the definitive layout container with baked-in 24px (p="6") padding,
 * responsive max-width (maxW="md"), and systematic vertical rhythm (gap="5").
 * Margin is strictly forbidden.
 */
export const DialogContent: ParentComponent<ComponentProps<typeof ArkDialog.Content>> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = dialog();
  return (
    <ArkDialog.Content
      {...rest}
      class={cx(
        styles.content,
        css({
          position: "relative",
          w: "full",
          maxW: "md",
          bg: "bg.default",
          p: "6",
          borderRadius: "l3",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "border.subtle",
          boxShadow: "xl",
          display: "flex",
          flexDirection: "column",
          gap: "5",
          color: "fg.default",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </ArkDialog.Content>
  );
};

export interface DialogCloseTriggerProps extends ComponentProps<typeof ArkDialog.CloseTrigger> {
  variant?: ButtonVariant["variant"];
  size?: ButtonVariant["size"];
}

/**
 * Close Trigger Primitive
 * Dual-mode:
 * 1. Default (no children/variant): Renders an accessible, absolute-positioned top-right 'X' icon button.
 * 2. Custom (with children or variant): Renders a styled button (e.g. Cancel button in footer).
 */
export const DialogCloseTrigger: ParentComponent<DialogCloseTriggerProps> = (props) => {
  const rest = omit(props, "variant", "size", "class", "children");
  const styles = dialog();
  const isCustom = () => Boolean(props.variant || props.size || props.children || props.asChild);

  return (
    <ArkDialog.CloseTrigger
      {...rest}
      class={cx(
        props.variant || props.size
          ? button({ variant: props.variant, size: props.size })
          : styles.closeTrigger,
        isCustom()
          ? undefined
          : css({
              position: "absolute",
              top: "4",
              right: "4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              w: "7",
              h: "7",
              borderRadius: "md",
              color: "fg.muted",
              cursor: "pointer",
              outline: "none",
              border: "none",
              bg: "transparent",
              transitionProperty: "colors",
              transitionDuration: "fast",
              _hover: { color: "fg.default", bg: "bg.subtle" },
              _focusVisible: {
                outlineWidth: "2px",
                outlineStyle: "solid",
                outlineColor: "accent.default",
                outlineOffset: "0.5",
              },
            }),
        props.class as string,
      )}
    >
      {props.asChild
        ? undefined
        : (props.children ?? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M11.78 3.22a.75.75 0 0 0-1.06 0L7.5 6.44 4.28 3.22a.75.75 0 0 0-1.06 1.06L8.56 7.5l3.22-3.22a.75.75 0 0 0 0-1.06Z" />
            </svg>
          ))}
    </ArkDialog.CloseTrigger>
  );
};

/**
 * Standard Dialog Header layout
 */
export const DialogHeader: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        css({
          display: "flex",
          flexDirection: "column",
          gap: "1.5",
          w: "full",
          pr: "8",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

/**
 * Accessible Dialog Title with token-based typography
 */
export const DialogTitle: ParentComponent<ComponentProps<typeof ArkDialog.Title>> = (props) => {
  const rest = omit(props, "class", "children");
  const styles = dialog();
  return (
    <ArkDialog.Title
      {...rest}
      class={cx(
        styles.title,
        css({
          textStyle: "lg",
          fontWeight: "semibold",
          color: "fg.default",
          lineHeight: "snug",
          letterSpacing: "tight",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </ArkDialog.Title>
  );
};

/**
 * Accessible Dialog Description with token-based typography
 */
export const DialogDescription: ParentComponent<ComponentProps<typeof ArkDialog.Description>> = (
  props,
) => {
  const rest = omit(props, "class", "children");
  const styles = dialog();
  return (
    <ArkDialog.Description
      {...rest}
      class={cx(
        styles.description,
        css({
          textStyle: "sm",
          color: "fg.muted",
          lineHeight: "relaxed",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </ArkDialog.Description>
  );
};

/**
 * Dialog Body container for scrollable or main content
 */
export const DialogBody: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        css({
          display: "flex",
          flexDirection: "column",
          gap: "4",
          w: "full",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

/**
 * Dialog Footer container for modal actions
 */
export const DialogFooter: ParentComponent<ComponentProps<"div">> = (props) => {
  const rest = omit(props, "class", "children");
  return (
    <div
      {...rest}
      class={cx(
        css({
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "3",
          w: "full",
          pt: "2",
        }),
        props.class as string,
      )}
    >
      {props.children}
    </div>
  );
};

/**
 * Portal wrapper that safely cleans up DOM nodes when dialog is closed.
 */
export interface DialogPortalProps {
  children: any;
}

export const DialogPortal: ParentComponent<DialogPortalProps> = (props) => {
  const dialog = useDialogContext();
  return (
    <Show when={dialog().open}>
      <SolidPortal>{props.children}</SolidPortal>
    </Show>
  );
};

/**
 * Unified Dialog compound component namespace.
 */
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
};
