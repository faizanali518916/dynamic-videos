type BuilderHeaderProps = {
  copied: boolean;
};

export const BuilderHeader = ({ copied }: BuilderHeaderProps) => (
  <div className="builder-topbar">
    <div>
      <div className="builder-kicker">1080 x 1920 / 30 fps</div>
      <h1>Infographic template builder</h1>
    </div>
    <button className="builder-primary" type="submit">
      {copied ? "Copied" : "Copy JSON"}
    </button>
  </div>
);
