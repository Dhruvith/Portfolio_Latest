import React from "react";
import { createRoot } from "react-dom/client";
import "lenis/dist/lenis.css";
import { App } from "./App.jsx";
import { MotionProvider } from "./motionSystem.jsx";
import "./styles.css";
import "./editorial.css";
import "./premium.css";
import "./reference-refresh.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MotionProvider><App /></MotionProvider>
  </React.StrictMode>,
);
