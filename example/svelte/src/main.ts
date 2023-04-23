import "./app.css";
import Example from "./Example.svelte";

const app = new Example({
  target: document.getElementById("app"),
});

export default app;
