type JsonPanelProps = {
  copied: boolean;
  json: string;
  jsonError: string | null;
  onCopy: () => void;
  onJsonChange: (value: string) => void;
};

export const JsonPanel = ({
  copied,
  json,
  jsonError,
  onCopy,
  onJsonChange,
}: JsonPanelProps) => (
  <aside className="json-panel">
    <div className="json-panel-head">
      <h2>Current JSON</h2>
      <button className="builder-secondary" onClick={onCopy} type="button">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
    <textarea
      aria-invalid={jsonError ? "true" : "false"}
      onChange={(event) => onJsonChange(event.target.value)}
      spellCheck={false}
      value={json}
    />
    {jsonError ? <p className="json-error">{jsonError}</p> : null}
  </aside>
);
