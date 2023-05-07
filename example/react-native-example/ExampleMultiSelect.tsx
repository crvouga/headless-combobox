import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Combobox from "./src";

/*


  Step 0: Have some data


  */

type Item = { id: number; label: string };
const fruits: Item[] = [
  { id: 0, label: "pear" },
  { id: 1, label: "apple" },
  { id: 2, label: "banana" },
  { id: 3, label: "orange" },
  { id: 4, label: "strawberry" },
  { id: 5, label: "kiwi" },
  { id: 6, label: "mango" },
  { id: 7, label: "pineapple" },
  { id: 8, label: "watermelon" },
  { id: 9, label: "grape" },
];

/*


  Step 1: Init the config


  */

const config = Combobox.initConfig<Item>({
  toItemId: (item) => item.id,
  toItemInputValue: (item) => item.label,
});

export default function ExampleMultiSelect() {
  const [model, setModel] = useState(
    Combobox.init<Item>({
      allItems: fruits,
      mode: {
        type: "multi-select",
        selectedItemsDirection: "right-to-left",
      },
    })
  );

  const inputRef = useRef<TextInput | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [itemY, setItemY] = useState<{ [itemId: string]: number }>({});

  /*


  Step 3: Write some glue code


  */

  const dispatch = (msg: Combobox.Msg<Item>) => {
    const output = Combobox.update(config, { msg, model });

    setModel(output.model);

    Combobox.runEffects(output, {
      focusSelectedItem: (_selectedItem) => {
        //
      },
      focusInput: () => {
        inputRef.current?.focus();
      },
      scrollItemIntoView: (item) => {
        const y = itemY[item.id];
        const scrollView = scrollViewRef.current;
        if (y && scrollView) {
          scrollView.scrollTo({ y, animated: true });
        }
      },
    });

    console.log(msg, output.model.type);
  };

  const state = Combobox.toState(config, model);
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <View style={styles.chipContainer}>
          {state.selections.map((item) => (
            <View
              key={item.id}
              style={{
                ...styles.chip,
                ...(state.isSelectedItemFocused(item)
                  ? styles.chipFocused
                  : {}),
              }}>
              <Text style={{ color: "inherit" }}>{item.label}</Text>
            </View>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Search fruits"
          value={state.inputValue}
          onFocus={() => dispatch({ type: "focused-input" })}
          onBlur={() => dispatch({ type: "blurred-input" })}
          onTouchStart={() => dispatch({ type: "pressed-input" })}
          ref={inputRef}
          onKeyPress={(e) => {
            const key = e.nativeEvent.key;
            const msg = Combobox.keyToMsg<Item>(key);
            if (msg.shouldPreventDefault) {
              e.preventDefault();
            }
            dispatch(msg);
          }}
          onChangeText={(text) =>
            dispatch({ type: "inputted-value", inputValue: text })
          }
        />

        {state.isOpened && (
          <ScrollView style={styles.suggestionList} ref={scrollViewRef}>
            {state.items.map((item) => (
              <View
                onLayout={(e) => {
                  const y = e?.nativeEvent?.layout?.y;
                  if (typeof y === "number") {
                    setItemY((itemY) => ({ ...itemY, [item.id]: y }));
                  }
                }}
                onTouchStart={() => dispatch({ type: "pressed-item", item })}
                style={{
                  ...styles.suggestionListItem,
                  ...(state.itemStatus(item) === "highlighted"
                    ? { backgroundColor: "#ccc" }
                    : state.itemStatus(item) === "selected"
                    ? styles.suggestionListItemSelected
                    : state.itemStatus(item) === "selected-and-highlighted"
                    ? { backgroundColor: "lightblue" }
                    : { backgroundColor: "transparent" }),
                }}
                key={item.id}>
                <Text style={{ color: "inherit" }}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  input: {
    width: "100%",
    fontSize: 20,
  },
  inputContainer: {
    width: "100%",
    padding: 10,
    border: "1px solid #ccc",
    position: "relative",
  },
  suggestionList: {
    width: "100%",
    border: "1px solid #ccc",
    position: "absolute",
    top: "100%",
    left: 0,
    // height: 200,
    overflow: "scroll",
  },
  suggestionListItem: {
    padding: 10,
  },
  suggestionListItemSelected: {
    backgroundColor: "blue",
    color: "#fff",
  },
  chipContainer: {
    // flexDirection: "row",
    // flexWrap: "wrap",
    justifyContent: "flex-end",
    flexDirection: "row-reverse",
    flexWrap: "wrap-reverse",
  },
  chip: {
    padding: 5,
    margin: 5,
    backgroundColor: "#eee",
    borderRadius: 5,
    fontSize: 16,
  },
  chipFocused: {
    backgroundColor: "blue",
    color: "#fff",
  },
});
