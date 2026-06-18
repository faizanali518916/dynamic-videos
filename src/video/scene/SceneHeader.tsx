import { Img, staticFile } from "remotion";
import type { Theme } from "../../layoutCatalog";

type SceneHeaderProps = {
  theme: Theme;
};

export const SceneHeader = ({ theme }: SceneHeaderProps) => (
  <header
    style={{
      top: 64,
      left: 0,
      right: 0,
      height: 92,
      zIndex: 20,
      display: "flex",
      padding: "0 64px",
      position: "absolute",
      alignItems: "center",
      pointerEvents: "none",
      justifyContent: "flex-end",
    }}
  >
    <Img
      alt=""
      src={staticFile("logo.png")}
      style={{
        height: 52,
        objectFit: "contain",
        width: "auto",
        filter:
          theme.background === "#ffffff"
            ? "drop-shadow(0 10px 26px rgba(0, 0, 0, 0.18))"
            : undefined,
      }}
    />
  </header>
);
