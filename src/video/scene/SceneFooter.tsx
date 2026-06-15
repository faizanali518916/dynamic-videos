import { Img, staticFile } from "remotion";

export const SceneFooter = () => (
  <footer
    style={{
      alignItems: "center",
      display: "flex",
      justifyContent: "flex-end",
      position: "relative",
      zIndex: 2,
    }}
  >
    <Img
      alt=""
      src={staticFile("logo.png")}
      style={{
        height: 54,
        objectFit: "contain",
        width: "auto",
      }}
    />
  </footer>
);
