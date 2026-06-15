import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import templateJson from "./template.json";
import type { InfographicTemplate } from "./layoutCatalog";
import { TemplateBuilderApp } from "./TemplateBuilderApp";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <main className="builder-shell builder-page">
      <TemplateBuilderApp initialTemplate={templateJson as InfographicTemplate} />
    </main>
  </React.StrictMode>,
);
