import { Config, Effect, Model, isItemSelected, isSelected } from "./combobox";

export const handleEffects = <T>(
  config: Config<T>,
  model: Model<T>,
  effects: Effect<T>[]
): void => {
  for (const effect of effects) {
    handleEffect({ config, model, effect });
  }
};

export const toInputProps = <T>(config: Config<T>, model: Model<T>) => {
  return {
    id: `${config.namespace}-combobox-input`,
  };
};

export const toOptionProps = <T>({
  config,
  index,
  model,
  option,
}: {
  config: Config<T>;
  model: Model<T>;
  option: T;
  index: number;
}) => {
  return {
    id: `${config.namespace}-combobox-option-${config.toItemId(option)}`,
    key: config.toItemId(option),
    tabIndex: -1,
    role: "option",
    "aria-selected": isItemSelected(config, model, option),
    "aria-disabled": false,
    "data-option-index": index,
  };
};

export const toListBoxProps = <T>(config: Config<T>) => {
  return {
    id: `${config.namespace}-combobox-listbox`,
    role: "listbox",
  };
};

const handleEffect = <T>({
  config,
  model,
  effect,
}: {
  config: Config<T>;
  model: Model<T>;
  effect: Effect<T>;
}): void => {
  switch (effect.type) {
    case "blur-input": {
      const inputProps = toInputProps(config, model);
      const inputElement = document.getElementById(inputProps.id);
      inputElement?.blur();
      return;
    }
    case "focus-input": {
      const inputProps = toInputProps(config, model);
      const inputElement = document.getElementById(inputProps.id);
      inputElement?.focus();
      return;
    }
    case "focus-selected-item": {
      return;
    }
    case "scroll-item-into-view": {
        const listboxProps = toListBoxProps(config);
        const listbox = document.getElementById(listboxProps.id);
        if(!listbox){ return}

      const option = listbox.querySelector(`[data-option-index="${effect.index}"]`);

      if(!option){
        return
      }
      option?.scrollIntoView({});
      return;
    }
  }
};
