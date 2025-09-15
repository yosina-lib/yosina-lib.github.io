import type {
  FunctionComponent,
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";
import { cloneElement, forwardRef, useCallback, useMemo } from "react";

export type TabProps = {
  children?: ReactNode;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const Tab = forwardRef<HTMLInputElement, TabProps>(
  ({ children, className, ...props }, ref) => (
    <label className="-mb-[2px] flex-none">
      <span className="peer block h-0 w-0 overflow-hidden">
        <input
          className="h-0 w-0 appearance-none"
          type="radio"
          ref={ref}
          {...props}
        />
      </span>
      <span
        className={`mb-[1px] block border-gray-300 border-b-1 text-gray-500 hover:bg-gray-100 peer-focus:bg-gray-100 peer-has-checked:mb-0 peer-has-checked:border-b-2 dark:hover:bg-gray-800 ${className} px-3 py-2`}
      >
        {children}
      </span>
    </label>
  ),
);

export const Tabs = <C extends FunctionComponent<TabProps>>({
  children,
  defaultValue,
  name,
  onChange,
  tabHighlightClassName,
}: {
  children?: ReactElement<TabProps, C> | Iterable<ReactElement<TabProps, C>>;
  defaultValue?: string | null;
  name: string;
  onChange: (value: string) => void;
  tabHighlightClassName: string;
}): ReactNode => {
  const renderedTabHighlightClassName = useMemo(
    () =>
      tabHighlightClassName
        .split(/\s+/)
        .map((c) => c.trim())
        .filter((c) => c !== "")
        .map((c) => `peer-has-checked:${c}`)
        .join(" "),
    [tabHighlightClassName],
  );
  const onChange_ = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );
  return (
    <nav className="flex flex-row flex-wrap border-gray-300 border-b-1 dark:border-gray-700">
      {children &&
        (Symbol.iterator in children ? Array.from(children) : [children]).map(
          (n, i) => {
            const cn = cloneElement<TabProps>(n, {
              name: name,
              key:
                n.key ??
                (n.props.value != null ? String(n.props.value) : undefined) ??
                String(i),
              className: renderedTabHighlightClassName,
              onChange: onChange_,
              defaultChecked:
                defaultValue === n.props.value
                  ? true
                  : (n.props.defaultChecked ?? i === 0),
            });
            return cn;
          },
        )}
    </nav>
  );
};
