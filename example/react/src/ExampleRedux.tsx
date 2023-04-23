import { configureStore } from "@reduxjs/toolkit";
import { useEffect, useRef } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import * as Autocomplete from "./headless-autocomplete";
import { Movie, top100Films } from "./movies";

const config: Autocomplete.Config<Movie> = {
  toItemId: (item) => item.label,
  toItemInputValue: (item) => item.label,
  deterministicFilter: (model) => Autocomplete.simpleFilter(config, model),
};

function ExampleRedux() {
  const autocompleteState = useSelector(
    (state: AppState) => state.autocomplete
  );
  const dispatch = useAppDispatch();

  const { model: state, effects } = autocompleteState;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const refs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    const runEffects = async () => {
      for (const effect of effects) {
        if (effect.type === "scroll-item-into-view") {
          await new Promise(requestAnimationFrame); // wait for dropdown to render

          const ref = refs.current.get(config.toItemId(effect.item));

          ref?.scrollIntoView({
            block: "nearest",
          });
        }

        if (effect.type === "focus-input") {
          console.log("FOCUS");
          inputRef.current?.focus({
            preventScroll: true,
          });
        }
      }
    };
    runEffects();
  }, [effects]);

  return (
    <div
      style={{
        fontSize: "1.25rem",
        outlineColor: "skyblue",
        fontFamily: "monospace",
        maxWidth: "720px",
        margin: "auto",
        width: "100%",
      }}>
      <p>
        Open up your{" "}
        <a href="https://github.com/reduxjs/redux-devtools">redux-devtools</a>.{" "}
        You can time travel debug the autocomplete state.
      </p>
      <p>{state.type}</p>

      <div style={{ position: "relative", width: "100%" }}>
        <input
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "inherit",
            fontFamily: "inherit",
            maxWidth: "100%",
            margin: 0,
            boxSizing: "border-box",
          }}
          ref={inputRef}
          value={Autocomplete.toCurrentInputValue(config, state)}
          onInput={(event) =>
            dispatch({
              type: "inputted-value",
              inputValue: event.currentTarget.value,
            })
          }
          onBlur={() => dispatch({ type: "blurred-input" })}
          onFocus={() => dispatch({ type: "focused-input" })}
          onClick={() => dispatch({ type: "pressed-input" })}
          onKeyDown={(event) => {
            const msg = Autocomplete.browserKeyboardEventKeyToMsg(event.key);
            if (msg) {
              dispatch(msg);
            }
          }}
        />
        {Autocomplete.isOpened(state) && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              zIndex: 2,
              left: 0,
              padding: 0,
              margin: 0,
              border: "1px solid black",
              maxHeight: "360px",
              overflow: "scroll",
              width: "100%",
              listStyle: "none",
            }}>
            {Autocomplete.toVisibleItems(config, state).map((item, index) => {
              const itemStatus = Autocomplete.toItemStatus(config, state, item);
              return (
                <li
                  key={item.label}
                  ref={(ref) => {
                    if (ref) {
                      refs.current.set(config.toItemId(item), ref);
                    }
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault(); // prevent input blur
                    dispatch({ type: "pressed-item", item });
                  }}
                  onMouseMove={() =>
                    dispatch({ type: "hovered-over-item", index })
                  }
                  style={{
                    margin: 0,
                    padding: "0.5rem",
                    cursor: "pointer",
                    ...(itemStatus === "selected"
                      ? {
                          background: "lightblue",
                          color: "white",
                        }
                      : itemStatus === "highlighted"
                      ? {
                          background: "black",
                          color: "white",
                        }
                      : itemStatus === "selected-and-highlighted"
                      ? {
                          background: "blue",
                          color: "white",
                        }
                      : itemStatus === "unselected"
                      ? {}
                      : {}),
                  }}>
                  {item.label} ({item.year})
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

//
//
// Redux Glue
//
//

type AppState = {
  autocomplete: {
    model: Autocomplete.Model<Movie>;
    effects: Autocomplete.Effect<Movie>[];
  };
};

type AppAction = Autocomplete.Msg<Movie>;

const store = configureStore<AppState, AppAction>({
  reducer: (state, action) => {
    const autocompleteModel: Autocomplete.Model<Movie> =
      state?.autocomplete.model ?? Autocomplete.init({ allItems: top100Films });

    const autocomplete = Autocomplete.update(config, {
      msg: action,
      model: autocompleteModel,
    });

    return {
      autocomplete,
    };
  },

  devTools: true,
});

const useAppDispatch: () => typeof store.dispatch = useDispatch;

function ReduxRoot() {
  return (
    <Provider store={store}>
      <ExampleRedux />
    </Provider>
  );
}

export default ReduxRoot;
