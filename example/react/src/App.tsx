import { useEffect, useState } from "react";
import Example from "./Example";
import ExampleRedux from "./ExampleRedux";

type Route = "example" | "example-redux";

const allRoutes: { [route in Route]: Route } = {
  example: "example",
  "example-redux": "example-redux",
};

const routeToName: { [route in Route]: string } = {
  example: "React",
  "example-redux": "React + Redux",
};

export default function App() {
  const [activeRoute, setActiveRoute] = useState<Route>("example");

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "example" || hash === "example-redux") {
        setActiveRoute(hash);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

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
          href="https://github.com/crvouga/headless-autocomplete"
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

      <nav style={{ width: "100%", display: "flex", alignItems: "center" }}>
        {Object.values(allRoutes).map((route) => {
          return (
            <a
              style={{
                padding: "0.5rem",
                textDecoration: "none",
                textAlign: "center",
                flex: 1,
                border: "1px solid black",
                backgroundColor: route === activeRoute ? "black" : "white",
                color: route === activeRoute ? "white" : "black",
              }}
              href={`#${route}`}>
              {routeToName[route]}
            </a>
          );
        })}
      </nav>
      {activeRoute === "example" && <Example />}
      {activeRoute === "example-redux" && <ExampleRedux />}
    </div>
  );
}
