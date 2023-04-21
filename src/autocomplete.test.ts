import { createAutocomplete } from "./autocomplete";

type Option = {
  id: string;
  name: string;
};

const test = () => {
  const inputElement = document.createElement("input");

  const autocomplete = createAutocomplete<Option>({
    inputElement,
    toKey: (option) => option.id,
    toQuery: (option) => option.name,
  });

  const before = autocomplete.getState();

  inputElement.focus();

  const after = autocomplete.getState();

  assert(before.opened === false);
  assert(after.opened === true);
};

test();

const assert = (bool: boolean) => {
  if (!bool) {
    throw new Error("assertion failed");
  }
};
