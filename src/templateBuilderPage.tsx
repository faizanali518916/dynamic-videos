import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import type { InfographicTemplate } from "./layoutCatalog";
import { TemplateBuilderApp } from "./TemplateBuilderApp";
import type { TranscriptPage } from "./video/types";

type ProjectSummary = {
  captions: boolean;
  hasTemplate: boolean;
  hasTokens: boolean;
  hasVideo: boolean;
  name: string;
  videoBased: boolean;
};

type ProjectPayload = ProjectSummary & {
  previewVideoSrc?: string;
  template: InfographicTemplate;
  transcriptPages: TranscriptPage[];
};

const getPathProject = () => window.location.pathname.replace(/^\/+|\/+$/g, "");

const TemplateBuilderPage = () => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectName, setProjectName] = useState(getPathProject());
  const [projectPayload, setProjectPayload] = useState<ProjectPayload | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const selectedProjectName = useMemo(() => {
    if (projectName && projects.some((project) => project.name === projectName)) {
      return projectName;
    }

    return projects[0]?.name ?? "";
  }, [projectName, projects]);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        const nextProjects = (await response.json()) as ProjectSummary[];

        if (!response.ok) {
          throw new Error("Could not load projects.");
        }

        if (!cancelled) {
          setProjects(nextProjects);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load projects.",
          );
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedProjectName) {
      return;
    }

    let cancelled = false;

    const loadProject = async () => {
      setError(null);
      setProjectPayload(null);

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(selectedProjectName)}`,
        );
        const payload = (await response.json()) as ProjectPayload & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load project.");
        }

        if (!cancelled) {
          setProjectPayload(payload);
          if (window.location.pathname !== `/${selectedProjectName}`) {
            window.history.replaceState(null, "", `/${selectedProjectName}`);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load project.",
          );
        }
      }
    };

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectName]);

  const handleProjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setProjectName(event.target.value);
  };

  return (
    <main className="builder-shell builder-page">
      <div className="project-switcher">
        <label className="builder-field">
          <span>Project</span>
          <select onChange={handleProjectChange} value={selectedProjectName}>
            {projects.map((project) => (
              <option key={project.name} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        {projectPayload ? (
          <p>
            {projectPayload.videoBased && !projectPayload.hasVideo
              ? "video.mp4 missing for this video-based project."
              : "Project loaded."}
            {projectPayload.captions && !projectPayload.hasTokens
              ? " tokens.json missing for captions."
              : ""}
          </p>
        ) : null}
      </div>

      {error ? <p className="project-error">{error}</p> : null}

      {projectPayload ? (
        <TemplateBuilderApp
          initialTemplate={projectPayload.template}
          key={projectPayload.name}
          previewVideoSrc={projectPayload.previewVideoSrc}
          projectName={projectPayload.name}
          transcriptPages={projectPayload.transcriptPages}
        />
      ) : !error ? (
        <p className="project-loading">Loading project...</p>
      ) : null}
    </main>
  );
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TemplateBuilderPage />
  </React.StrictMode>,
);
