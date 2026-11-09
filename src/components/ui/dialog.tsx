import { Dialog as ArkDialog, useDialogContext } from "@ark-ui/solid/dialog";
import { isServer, Portal as SolidPortal } from "@solidjs/web";
import type { ComponentProps, ParentComponent } from "solid-js";
import { Show } from "solid-js";
import { cx } from "styled-system/css";
import { type ButtonVariant, button, dialog } from "styled-system/recipes";
import { omitProps, toClass } from "./tokens";

export const DialogRoot = ArkDialog.Root;

export interface DialogTriggerProps
  extends Omit<ComponentProps<typeof ArkDialog.Trigger>, "style"> {
  variant?: ButtonVariant["variant"];
  size?: ButtonVariant["size"];
}

export const DialogTrigger: ParentComponent<DialogTriggerProps> = (props) => {
  const rest = omitProps(props, "variant", "size", "class", "children", "style");
  return (
    <ArkDialog.Trigger
      {...rest}
      class={cx(
        props.variant || props.size
          ? button({ variant: props.variant, size: props.size })
          : undefined,
        toClass(props.class),
      )}
    >
      {props.children}
    </ArkDialog.Trigger>
  );
};

export const DialogBackdrop: ParentComponent<
  Omit<ComponentProps<typeof ArkDialog.Backdrop>, "style">
> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  const styles = dialog();
  return (
    <ArkDialog.Backdrop {...rest} class={cx(styles.backdrop, toClass(props.class))}>
      {props.children}
    </ArkDialog.Backdrop>
  );
};

export const DialogPositioner: ParentComponent<
  Omit<ComponentProps<typeof ArkDialog.Positioner>, "style">
> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  const styles = dialog();
  return (
    <ArkDialog.Positioner {...rest} class={cx(styles.positioner, toClass(props.class))}>
      {props.children}
    </ArkDialog.Positioner>
  );
};

export const DialogContent: ParentComponent<
  Omit<ComponentProps<typeof ArkDialog.Content>, "style">
> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  const styles = dialog();
  return (
    <ArkDialog.Content {...rest} class={cx(styles.content, toClass(props.class))}>
      {props.children}
    </ArkDialog.Content>
  );
};

export interface DialogCloseTriggerProps
  extends Omit<ComponentProps<typeof ArkDialog.CloseTrigger>, "style"> {
  variant?: ButtonVariant["variant"];
  size?: ButtonVariant["size"];
}

export const DialogCloseTrigger: ParentComponent<DialogCloseTriggerProps> = (props) => {
  const rest = omitProps(props, "variant", "size", "class", "children", "style");
  const styles = dialog();

  const isButtonStyled = () => Boolean(props.variant || props.size || props.children);

  return (
    <ArkDialog.CloseTrigger
      {...rest}
      class={cx(
        isButtonStyled()
          ? button({ variant: props.variant ?? "outline", size: props.size ?? "sm" })
          : styles.closeTrigger,
        toClass(props.class),
      )}
      aria-label={!props.children ? (props["aria-label"] ?? "Close dialog") : props["aria-label"]}
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
              <path d="M11.5 3.5L3.5 11.5M3.5 3.5L11.5 11.5" />
            </svg>
          ))}
    </ArkDialog.CloseTrigger>
  );
};

export const DialogHeader: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  const styles = dialog();
  return (
    <div {...rest} class={cx(styles.header, toClass(props.class))}>
      {props.children}
    </div>
  );
};

export const DialogTitle: ParentComponent<Omit<ComponentProps<typeof ArkDialog.Title>, "style">> = (
  props,
) => {
  const rest = omitProps(props, "class", "children", "style");
  const styles = dialog();
  return (
    <ArkDialog.Title {...rest} class={cx(styles.title, toClass(props.class))}>
      {props.children}
    </ArkDialog.Title>
  );
};

export const DialogDescription: ParentComponent<
  Omit<ComponentProps<typeof ArkDialog.Description>, "style">
> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  const styles = dialog();
  return (
    <ArkDialog.Description {...rest} class={cx(styles.description, toClass(props.class))}>
      {props.children}
    </ArkDialog.Description>
  );
};

export const DialogBody: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  const styles = dialog();
  return (
    <div {...rest} class={cx(styles.body, toClass(props.class))}>
      {props.children}
    </div>
  );
};

export const DialogFooter: ParentComponent<Omit<ComponentProps<"div">, "style">> = (props) => {
  const rest = omitProps(props, "class", "children", "style");
  const styles = dialog();
  return (
    <div {...rest} class={cx(styles.footer, toClass(props.class))}>
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
};

export default Dialog;
