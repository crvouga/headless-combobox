import { Config, Effect, Model } from "./combobox";

export const handleEffects = <T>(config: Config<T>, model: Model<T>,effects: Effect<T>[]): void => {
    for (const effect of effects) {
        handleEffect({config, model, effect})
    }
};

const toInputProps = <T>(config: Config<T>, model: Model<T>) => {
    return {
        id:`${config.namespace}-combobox-input`,
    }
}

const toItemProps = <T>(config: Config<T>, model: Model<T>, item: T) => {
    return {
        id: `${config.namespace}-combobox-item-${config.toItemId(item)}`,
    }
}

 const handleEffect = <T>({
    config, model, effect}:{config: Config<T>, model: Model<T>, effect: Effect<T>, }): void => {
    
    switch (effect.type) {
        case 'blur-input': {
            const inputProps = toInputProps(config, model)
            const inputElement = document.getElementById(inputProps.id)
            inputElement?.blur()
            return
        }
        case 'focus-input': {
            const inputProps = toInputProps(config, model)
            const inputElement = document.getElementById(inputProps.id)
            inputElement?.focus()
            return
        }
        case 'focus-selected-item': {
            return
        }
        case 'scroll-item-into-view': {
            const itemProps = toItemProps(config, model, effect.item)
            const itemElement = document.getElementById(itemProps.id)
            itemElement?.scrollIntoView()
            return
        }

    }
};
