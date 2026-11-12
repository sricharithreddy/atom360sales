import React from "react";
import { createRoot } from "react-dom/client";

// Each app was designed as a standalone 420px card with rounded corners and a
// drop shadow. Inside the phone frame it should fill the screen edge to edge.
const FILL_SCREEN = `
  html, body, #root { margin: 0; padding: 0; height: 100%; background: #F3F4F9; }
  #root > div, #root .rm-card {
    max-width: none !important; max-height: none !important;
    border-radius: 0 !important; box-shadow: none !important;
  }
  /* Telecaller: let its flex columns shrink to a 390px phone instead of
     growing to fit their widest row. */
  .rm-outer, .rm-card, .rm-content { min-width: 0 !important; }
`;

export function mountApp(App) {
  const style = document.createElement("style");
  style.textContent = FILL_SCREEN;
  document.head.appendChild(style);
  createRoot(document.getElementById("root")).render(<App />);
}
