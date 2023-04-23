import Example from "./Example";

export default function App() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        margin: "auto",
        maxWidth: "720px",
      }}>
      <div style={{ padding: "1rem 0" }}>
        <a
          href="https://github.com/crvouga/headless-combobox"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "0.5rem",
            display: "block",
            textDecoration: "none",
            color: "black",
            border: "black 1px solid",
            width: "max-content",
          }}>
          Source Code Here
        </a>
      </div>

      <Example />
    </div>
  );
}
