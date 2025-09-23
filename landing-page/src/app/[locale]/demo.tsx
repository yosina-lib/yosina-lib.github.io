"use client";

import type { TransliterationRecipe } from "@yosina-lib/yosina";
import { makeTransliterator } from "@yosina-lib/yosina";
import type {
  FunctionComponent,
  HTMLAttributes,
  MouseEventHandler,
  ReactNode,
  Ref,
} from "react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { SimpleButton } from "./_components/button";
import { CheckboxAndLabel } from "./_components/checkbox";
import { pageLocaleContext } from "./demo-sections";

type RecipeViewModel = {
  toFullwidth: boolean;
  toHalfwidth: boolean;
  toHalfwidthIncludingHalfwidthKatakanas: boolean;
  hiraganaToKatakana: boolean;
  katakanaToHiragana: boolean;
  replaceCombinedCharacters: boolean;
  replaceCircledOrSquaredCharacters: boolean;
  replaceHyphens: boolean;
  kanjiOldNew: boolean;
  text: string;
};

const getExampleText = (recipe: TransliterationRecipe): string => {
  const result: string[] = [];
  if (recipe.toFullwidth) {
    result.push("#$%^&()[]¥\\");
  }
  if (recipe.toHalfwidth) {
    result.push("＃＄％＾＆（）［］￥＼");
  }
  switch (recipe.hiraKata) {
    case "hira-to-kata":
      result.push("かたかな");
      break;
    case "kata-to-hira":
      result.push("ヒラガナ");
      break;
  }
  if (recipe.replaceCombinedCharacters) {
    result.push("㍿㋿㍻㍼㌖㍖🄐🄑🄒㈪㈫㈬");
  }
  if (recipe.replaceCircledOrSquaredCharacters) {
    result.push("①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉅㊋㉆㊙Ⓢ㉄〶🈠🈡🈢🈣🈤🈥🈦🈧🈨🈀");
  }
  if (recipe.replaceHyphens) {
    result.push("ーー〜");
  }
  if (recipe.kanjiOldNew) {
    result.push("舊字體");
  }
  return result.join("");
};

const buildRecipeFromRecipeViewModel = ({
  toFullwidth,
  toHalfwidth,
  toHalfwidthIncludingHalfwidthKatakanas,
  hiraganaToKatakana,
  katakanaToHiragana,
  replaceCombinedCharacters,
  replaceCircledOrSquaredCharacters,
  replaceHyphens,
  kanjiOldNew,
}: RecipeViewModel): TransliterationRecipe => ({
  toFullwidth: toFullwidth ? "u005c-as-yen-sign" : false,
  toHalfwidth: toHalfwidthIncludingHalfwidthKatakanas
    ? "hankaku-kana"
    : toHalfwidth,
  hiraKata: hiraganaToKatakana
    ? "hira-to-kata"
    : katakanaToHiragana
      ? "kata-to-hira"
      : undefined,
  replaceCombinedCharacters,
  replaceCircledOrSquaredCharacters,
  replaceHyphens,
  kanjiOldNew,
});

type PartialUseFormReturnType<T extends FieldValues> = {
  register: UseFormReturn<T>["register"];
  watch: UseFormReturn<T>["watch"];
  getValues: UseFormReturn<T>["getValues"];
};

type OptionChooserProps = PartialUseFormReturnType<RecipeViewModel> & {
  className?: string;
  onActive?: () => void;
  onInactive?: () => void;
};

const OptionsChooserInner: FunctionComponent<
  OptionChooserProps &
    HTMLAttributes<HTMLDivElement> & {
      firstFocusableRef?: Ref<HTMLElement>;
      fieldContainerClassName?: string;
    }
> = ({
  firstFocusableRef,
  register,
  watch,
  className,
  fieldContainerClassName,
}) => {
  const firstFocusableRegister = (props: ReturnType<typeof register>) => ({
    ...props,
    ref: ((instance) => {
      props.ref(instance);
      if (typeof firstFocusableRef === "function") {
        firstFocusableRef(instance);
      } else if (firstFocusableRef != null) {
        firstFocusableRef.current = instance;
      }
    }) satisfies (typeof props)["ref"],
  });
  const { catalog } = useContext(pageLocaleContext);
  const data = watch();
  return (
    <div className={className}>
      <div className={fieldContainerClassName}>
        <CheckboxAndLabel
          label={catalog["Halfwidth to Fullwidth (U+005C treated as Yen sign)"]}
          {...firstFocusableRegister(
            register("toFullwidth", {
              disabled:
                data.toHalfwidth || data.toHalfwidthIncludingHalfwidthKatakanas,
              deps: ["toHalfwidth", "toHalfwidthIncludingHalfwidthKatakanas"],
            }),
          )}
        />
      </div>
      <div className={fieldContainerClassName}>
        <CheckboxAndLabel
          label={catalog["Fullwidth to Halfwidth"]}
          {...register("toHalfwidth", {
            disabled:
              data.toFullwidth || data.toHalfwidthIncludingHalfwidthKatakanas,
            deps: ["toFullwidth", "toHalfwidthIncludingHalfwidthKatakanas"],
          })}
        />
      </div>
      <div className={fieldContainerClassName}>
        <CheckboxAndLabel
          label={
            catalog["Fullwidth to Halfwidth (including halfwidth katakana)"]
          }
          {...register("toHalfwidthIncludingHalfwidthKatakanas", {
            disabled: data.toFullwidth || data.toHalfwidth,
            deps: ["toFullwidth", "toHalfwidth"],
          })}
        />
      </div>
      <div className={fieldContainerClassName}>
        <CheckboxAndLabel
          label={catalog["Hiragana to Katakana"]}
          {...register("hiraganaToKatakana", {
            disabled: data.katakanaToHiragana,
            deps: ["katakanaToHiragana"],
          })}
        />
      </div>
      <div className={fieldContainerClassName}>
        <CheckboxAndLabel
          label={catalog["Katakana to Hiragana"]}
          {...register("katakanaToHiragana", {
            disabled: data.hiraganaToKatakana,
            deps: ["hiraganaToKatakana"],
          })}
        />
      </div>
      <div className={fieldContainerClassName}>
        <CheckboxAndLabel
          label={catalog["Replace composed characters"]}
          {...register("replaceCombinedCharacters")}
        />
      </div>
      <div className={fieldContainerClassName}>
        <CheckboxAndLabel
          label={catalog["Replace circled or squared characters"]}
          {...register("replaceCircledOrSquaredCharacters")}
        />
      </div>
      <div className={fieldContainerClassName}>
        <CheckboxAndLabel
          label={catalog["Normalize hyphens"]}
          {...register("replaceHyphens")}
        />
      </div>
      <div className={fieldContainerClassName}>
        <CheckboxAndLabel
          label={catalog["Replace traditiona kanjis to new style ones"]}
          {...register("kanjiOldNew")}
        />
      </div>
    </div>
  );
};

const RenderOptionsInner: FunctionComponent<{ values: RecipeViewModel }> = ({
  values,
}) => {
  const { catalog } = useContext(pageLocaleContext);
  const components: ReactNode[] = [];
  if (values.kanjiOldNew) {
    components.push(
      <span key="kanjiOldNew">
        {catalog["Replace traditiona kanjis to new style ones"]}
      </span>,
    );
  }
  if (values.toFullwidth) {
    components.push(
      <span key="toFullwidth">
        {catalog["Halfwidth to Fullwidth (U+005C treated as Yen sign)"]}
      </span>,
    );
  }
  if (values.toHalfwidth) {
    components.push(
      <span key="toHalfwidth">{catalog["Fullwidth to Halfwidth"]}</span>,
    );
  }
  if (values.toHalfwidthIncludingHalfwidthKatakanas) {
    components.push(
      <span key="toHalfwidthIncludingHalfwidthKatakana">
        {catalog["Fullwidth to Halfwidth (including halfwidth katakana)"]}
      </span>,
    );
  }
  if (values.hiraganaToKatakana) {
    components.push(
      <span key="hiraganaToKatakana">{catalog["Hiragana to Katakana"]}</span>,
    );
  }
  if (values.katakanaToHiragana) {
    components.push(
      <span key="katakanaToHiragana">{catalog["Katakana to Hiragana"]}</span>,
    );
  }
  if (values.replaceCombinedCharacters) {
    components.push(
      <span key="replaceCombinedCharacters">
        {catalog["Replace composed characters"]}
      </span>,
    );
  }
  if (values.replaceCircledOrSquaredCharacters) {
    components.push(
      <span key="replaceCircledOrSquaredCharacters">
        {catalog["Replace circled or squared characters"]}
      </span>,
    );
  }
  if (components.length === 0) {
    return (
      <span>
        ({catalog["None selected; click here to add transliteration options"]})
      </span>
    );
  }
  return components.flatMap((node, index) => {
    if (index === 0) {
      return [node];
    } else {
      return [" / ", node];
    }
  });
};

const RenderOptions: FunctionComponent<
  Omit<HTMLAttributes<HTMLElement>, "onClick" | "onKeyDown" | "onKeyUp"> & {
    values: RecipeViewModel;
    onClick: () => void;
  }
> = ({ className, tabIndex, values, onClick, ...props }) => {
  tabIndex ||= 0;
  const ref = useRef<HTMLButtonElement>(null);
  const onContainerClick: MouseEventHandler = useCallback(() => {
    if (document.activeElement !== ref?.current) {
      return;
    }
    onClick();
  }, [onClick]);
  return (
    <button
      ref={ref}
      className={`group relative flex appearance-none items-center rounded-sm border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 active:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:active:bg-gray-500 dark:hover:bg-gray-600 ${className ?? ""}`}
      tabIndex={tabIndex}
      type="button"
      title="Open option chooser"
      {...props}
      onClick={onContainerClick}
    >
      <span
        className="absolute top-2 left-2 block rounded-sm bg-gray-200 px-1 ltr:mr-2 rtl:ml-2 dark:bg-gray-600"
        aria-hidden="true"
      >
        &middot;&middot;&middot;
      </span>
      <span className="flex-1 truncate p-2 text-left indent-7">
        <RenderOptionsInner values={values} />
      </span>
    </button>
  );
};

const OptionsChooser: FunctionComponent<OptionChooserProps> = ({
  register,
  watch,
  getValues,
  className,
  onActive,
  onInactive,
}) => {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = (([active, setActive]) => [
    active,
    (newState: boolean) => {
      setActive(newState);
      if (newState) {
        onActive?.();
      } else {
        onInactive?.();
      }
    },
  ])(useState(false));
  const onMenuButtonClicked = useCallback(() => {
    setActive(!active);
  }, [active, setActive]);
  const onModalCloseButtonClicked = useCallback(() => {
    setActive(false);
  }, [setActive]);
  useEffect(() => {
    if (active) {
      ref?.current?.focus();
    }
  }, [active]);
  const values = getValues();
  return (
    <div className={`relative flex flex-col ${className ?? ""}`}>
      <RenderOptions
        className="h-10 md:hidden"
        values={values}
        onClick={onMenuButtonClicked}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 left-0 flex ${active || "hidden"} sm:absolute sm:bottom-auto md:static md:block`}
      >
        {/** biome-ignore lint/a11y/noStaticElementInteractions: alternative interation provided elsewhere */}
        {/** biome-ignore lint/a11y/useKeyWithClickEvents: alternative interation provided elsewhere */}
        <div
          className="fixed top-0 right-0 bottom-0 left-0 sm:bg-transparent md:hidden"
          title="Close option chooser"
          onClick={onModalCloseButtonClicked}
        >
          <div className="absolute inset-0 bg-gray-900 opacity-30 opacity-50 dark:bg-gray-100 dark:sm:bg-transparent"></div>
          <button
            className="absolute top-0 right-0 block px-3 py-2 font-bold text-gray-200 sm:hidden dark:text-gray-800"
            type="button"
          >
            &#x2715;
          </button>
        </div>
        <div
          className={`fixed top-10 right-0 bottom-0 left-0 flex ${active || "hidden"} mt-0 sm:absolute sm:bottom-auto sm:mt-1 md:static md:mt-0 md:block`}
        >
          <OptionsChooserInner
            firstFocusableRef={ref}
            className="flex flex-1 flex-col rounded-sm border border-gray-300 bg-gray-100 p-0 shadow-gray-800/10 shadow-lg md:mt-0 md:flex-row md:flex-wrap md:space-x-2 md:bg-transparent md:p-1 dark:border-gray-800 dark:bg-gray-700 dark:shadow-none"
            fieldContainerClassName="rounded-sm hover:bg-gray-200 dark:hover:bg-gray-600 p-3 sm:p-2"
            register={register}
            watch={watch}
            getValues={getValues}
          />
        </div>
      </div>
    </div>
  );
};

export type RecipeAndText = { recipe: TransliterationRecipe; text: string };

export const Demo: FunctionComponent<{
  onRecipeChange?: (value: RecipeAndText) => void;
}> = ({ onRecipeChange }) => {
  const { register, getValues, setValue, watch, subscribe } =
    useForm<RecipeViewModel>({
      values: {
        toFullwidth: true,
        toHalfwidth: false,
        toHalfwidthIncludingHalfwidthKatakanas: false,
        hiraganaToKatakana: false,
        katakanaToHiragana: false,
        replaceCombinedCharacters: false,
        replaceCircledOrSquaredCharacters: false,
        replaceHyphens: false,
        kanjiOldNew: false,
        text: "",
      },
    });
  const [result, setResult] = useState("");
  const [optionsChooserActive, setOptionsChooserActive] = useState(false);
  const [recipeAndText, setRecipeAndtext] = useState<RecipeAndText | undefined>(
    undefined,
  );
  const { catalog } = useContext(pageLocaleContext);
  subscribe({
    formState: { values: true },
    callback: (state) => {
      const recipe = buildRecipeFromRecipeViewModel(state.values);
      const newValue = { recipe, text: state.values.text };
      setRecipeAndtext(newValue);
      onRecipeChange?.(newValue);
    },
  });
  useEffect(() => {
    if (recipeAndText === undefined) {
      return;
    }
    (async (): Promise<(_: string) => string> => {
      try {
        return await makeTransliterator(recipeAndText.recipe);
      } catch (_) {
        return (v) => v;
      }
    })().then((transliterator) => {
      setResult(transliterator(recipeAndText.text));
    });
  }, [recipeAndText]);
  const onButtonClick = useCallback(() => {
    if (recipeAndText === undefined) {
      return;
    }
    setValue("text", recipeAndText.text + getExampleText(recipeAndText.recipe));
  }, [recipeAndText, setValue]);
  const onOptionsChooserActive = useCallback(() => {
    setOptionsChooserActive(true);
  }, []);
  const onOptionsChooserInactive = useCallback(() => {
    setOptionsChooserActive(false);
  }, []);

  return (
    <form className="flex flex-col">
      <OptionsChooser
        register={register}
        watch={watch}
        getValues={getValues}
        onActive={onOptionsChooserActive}
        onInactive={onOptionsChooserInactive}
      />
      <div className="my-2 sm:my-3">
        <SimpleButton onClick={onButtonClick} disabled={optionsChooserActive}>
          {catalog["Insert example text"]}
        </SimpleButton>
      </div>
      <div className="flex flex-1 flex-col items-stretch space-x-0 space-y-2 md:flex-row md:space-x-2 md:space-y-0">
        <div className="flex h-40 rounded-sm border border-gray-300 md:flex-1 dark:border-gray-600">
          <textarea
            className="flex-1 p-2"
            placeholder="Type text here..."
            disabled={optionsChooserActive}
            {...register("text")}
          ></textarea>
        </div>
        <div className="flex h-40 rounded-sm border border-gray-300 md:flex-1 dark:border-gray-600">
          <div
            className="flex-1 overflow-y-scroll overscroll-y-contain p-2"
            id="rendered-text"
          >
            {result}
          </div>
        </div>
      </div>
    </form>
  );
};
