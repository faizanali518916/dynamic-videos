type JsonPanelProps = {
  copied: boolean;
  json: string;
  onCopy: () => void;
};

export const JsonPanel = ({ copied, json, onCopy }: JsonPanelProps) => (
  <aside className="json-panel">
    <div className="json-panel-head">
      <h2>src/projects/process-optimization/template.json</h2>
      <button className="builder-secondary" onClick={onCopy} type="button">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
    <textarea readOnly value={json} />
  </aside>
);
