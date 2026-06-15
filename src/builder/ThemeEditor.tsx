import type { Theme } from "../layoutCatalog";

type ThemeEditorProps = {
  onChange: (key: keyof Theme, value: string) => void;
  theme: Theme;
};

export const ThemeEditor = ({ onChange, theme }: ThemeEditorProps) => (
  <div className="theme-grid">
    {(Object.keys(theme) as Array<keyof Theme>).map((key) => (
      <label className="builder-field color-field" key={key}>
        <span>{key}</span>
        <input
          onChange={(event) => onChange(key, event.target.value)}
          type="color"
          value={theme[key]}
        />
      </label>
    ))}
  </div>
);
