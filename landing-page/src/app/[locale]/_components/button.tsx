import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

export const SimpleButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, ...props }, ref) => (
  <button
    className={`rounded-sm bg-pink-600 px-6 py-1 text-white hover:bg-pink-700 active:bg-pink-700 sm:py-2 dark:active:bg-pink-450 dark:hover:bg-pink-500 ${className}`}
    type="button"
    ref={ref}
    {...props}
  >
    {children}
  </button>
));
