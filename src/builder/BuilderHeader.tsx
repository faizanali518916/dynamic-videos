type BuilderHeaderProps = {
  copied: boolean;
};

export const BuilderHeader = ({ copied }: BuilderHeaderProps) => (
  <div className="builder-topbar">
    <div>
      <h1>Template Builder</h1>
    </div>
    <button className="builder-primary" type="submit">
      {copied ? "Copied" : "Copy JSON"}
    </button>
  </div>
);
