import { Img, staticFile } from "remotion";
import type { Theme } from "../../layoutCatalog";

type SceneHeaderProps = {
  theme: Theme;
};

export const SceneHeader = ({ theme }: SceneHeaderProps) => (
  <header
    style={{
      alignItems: "center",
      display: "flex",
      height: 92,
      justifyContent: "flex-end",
      position: "relative",
      zIndex: 2,
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
