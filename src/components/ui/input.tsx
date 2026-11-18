import type { ComponentProps } from "@solidjs/web";
import type { Component } from "solid-js";
import { flush, omit, untrack } from "solid-js";
import { type InputVariant, input } from "styled-system/recipes";

export interface InputProps extends Omit<ComponentProps<"input">, "style" | "size"> {
  size?: InputVariant["size"];
  invalid?: boolean;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

type InputElementEvent = Parameters<
  Extract<ComponentProps<"input">["onInput"], (...args: never[]) => unknown>
>[0];

interface InputBaseProps extends InputProps {
  valueBinding: { value: string } | { defaultValue?: string };
  onInputEvent: (e: InputElementEvent) => void;
}

const InputBase: Component<InputBaseProps> = (props) => {
  const rest = omit(
    props,
    "size",
    "invalid",
    "onValueChange",
    "class",
    "value",
    "defaultValue",
    "onInput",
    "valueBinding",
    "onInputEvent",
  );

  return (
    <input
      {...rest}
      {...props.valueBinding}
      onInput={(e) => props.onInputEvent(e)}
      class={[
        input({
          size: props.size,
          invalid: props.invalid,
        }),
        props.class,
      ]}
    />
  );
};

const ControlledInput: Component<InputProps> = (props) => {
  const valueBinding = {
    get value() {
      return String(props.value ?? "");
    },
  };

  const handleInput = (e: InputElementEvent) => {
    const el = e.currentTarget;
    props.onValueChange?.(el.value);
    if (typeof props.onInput === "function") {
      props.onInput(e);
    }
    flush();
    const committed = String(untrack(() => props.value) ?? "");
    if (el.value !== committed) {
      el.value = committed;
    }
  };

  return <InputBase {...props} valueBinding={valueBinding} onInputEvent={handleInput} />;
};

const UncontrolledInput: Component<InputProps> = (props) => {
  const valueBinding = {
    get defaultValue() {
      return props.defaultValue;
    },
  };

  const handleInput = (e: InputElementEvent) => {
    props.onValueChange?.(e.currentTarget.value);
    if (typeof props.onInput === "function") {
      props.onInput(e);
    }
  };

  return <InputBase {...props} valueBinding={valueBinding} onInputEvent={handleInput} />;
};

/**
 * Systematic Input Primitive
 *
 * Synchronously routes controlled (`value` provided) and uncontrolled (`defaultValue` only)
 * modes to dedicated branches without `<Show>` overhead:
 * - Controlled mode: binds directly to `props.value` and reconciles `e.currentTarget.value`
 *   after `onValueChange` + `flush()` so rejected or formatted input stays strictly synchronized.
 * - Uncontrolled mode: binds `defaultValue` only so sibling attribute updates (such as `invalid`
 *   or `class`) never trigger `UNCOMMITTED_INPUT_OVERWRITTEN`.
 */
export const Input: Component<InputProps> = (props) => {
  const isControlled = untrack(() => props.value !== undefined);
  return <>{isControlled ? <ControlledInput {...props} /> : <UncontrolledInput {...props} />}</>;
};

export default Input;
