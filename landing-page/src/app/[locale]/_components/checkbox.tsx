"use client";

import type { FunctionComponent, InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

type CheckboxElementAttrs<T extends FieldValues> =
  InputHTMLAttributes<HTMLInputElement> &
    ReturnType<UseFormReturn<T>["register"]>;

export const Checkbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...attrs }, ref) => {
  return (
    <input
      ref={ref}
      {...attrs}
      type="checkbox"
      className={`h-4 w-4 rounded-sm bg-gray-200 ${className}`}
    />
  );
});

export const CheckboxAndLabel: FunctionComponent<
  CheckboxElementAttrs<FieldValues> & {
    label: string;
  }
> = ({ id, label, ...checkboxProps }) => (
  <label className="flex flex-row items-center leading-none" htmlFor={id}>
    <Checkbox
      {...checkboxProps}
      id={id}
      className="peer me-2 flex-none accent-blue-500"
    />
    <span className="flex-1 peer-disabled:text-gray-500">{label}</span>
  </label>
);
