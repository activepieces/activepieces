/* Icons are drawn with CSS masks (see custom.css .pp-i-*). Mintlify's MDX
   renderer drops inline <svg> inside custom components, so we avoid it. Each
   icon inherits its parent's `color` via `background-color: currentColor`. */

/* ---------------- Basic ---------------- */

export const ShortTextPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Name <span className="pp-req">*</span></span>
      <div className="pp-input pp-ph">Enter your name</div>
    </div>
  </div>
);

export const LongTextPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Description</span>
      <div className="pp-input pp-textarea pp-ph">Enter a description</div>
    </div>
  </div>
);

export const RichTextPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Body <span className="pp-req">*</span></span>
      <div className="pp-rt">
        <div className="pp-rt-toolbar">
          <span className="pp-rt-btn pp-b">B</span>
          <span className="pp-rt-btn pp-i">I</span>
          <span className="pp-rt-btn pp-u">U</span>
          <span className="pp-rt-sep" />
          <span className="pp-rt-btn"><span className="pp-i pp-i-link" /></span>
          <span className="pp-rt-btn">•</span>
          <span className="pp-rt-btn" style={{ fontSize: '11px' }}>1.</span>
        </div>
        <div className="pp-rt-body">Hi <span className="pp-mention">First name</span>, thanks for reaching out — we'll reply shortly.</div>
      </div>
    </div>
  </div>
);

export const CheckboxPreview = () => {
  const [on, setOn] = useState(true);
  return (
    <div className="pp">
      <label className="pp-switch-row" style={{ cursor: 'pointer' }} onClick={() => setOn((v) => !v)}>
        <span className={on ? 'pp-switch' : 'pp-switch pp-off'} />
        <span>
          <span className="pp-t">Agree to Terms</span>
          <span className="pp-d" style={{ display: 'block' }}>Check this box to agree to the terms</span>
        </span>
      </label>
    </div>
  );
};

export const MarkdownPreview = () => (
  <div className="pp">
    <div className="pp-note">
      <strong>Heads up</strong>
      Paste your webhook URL into the service to start receiving events.
    </div>
  </div>
);

export const DateTimePreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Date and Time <span className="pp-req">*</span></span>
      <div className="pp-input pp-select"><span>2023-06-09 12:00</span><span style={{ color: '#a3a3a3' }}><span className="pp-i pp-i-cal" /></span></div>
    </div>
  </div>
);

export const NumberPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Quantity <span className="pp-req">*</span></span>
      <div className="pp-input pp-ph">0</div>
    </div>
  </div>
);

export const StaticDropdownPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Country <span className="pp-req">*</span></span>
      <div className="pp-input pp-select"><span>United States</span><span className="pp-caret" /></div>
    </div>
  </div>
);

export const StaticMultiSelectPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Colors <span className="pp-req">*</span></span>
      <div className="pp-input pp-select" style={{ height: 'auto', padding: '6px 10px' }}>
        <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className="pp-chip">Red <span className="pp-x">×</span></span>
          <span className="pp-chip">Blue <span className="pp-x">×</span></span>
        </span>
        <span className="pp-caret" />
      </div>
    </div>
  </div>
);

export const JsonPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Data <span className="pp-req">*</span></span>
      <div className="pp-code">{`{\n  `}<span className="pp-key">"key"</span>{`: `}<span className="pp-str">"value"</span>{`,\n  `}<span className="pp-key">"count"</span>{`: `}<span className="pp-str">3</span>{`\n}`}</div>
    </div>
  </div>
);

export const DictionaryPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Options <span className="pp-req">*</span></span>
      <div className="pp-list">
        <div className="pp-kv"><div className="pp-input">key1</div><div className="pp-input">value1</div><span className="pp-iconbtn">×</span></div>
        <div className="pp-kv"><div className="pp-input">key2</div><div className="pp-input">value2</div><span className="pp-iconbtn">×</span></div>
      </div>
      <span className="pp-add">+ Add item</span>
    </div>
  </div>
);

export const FilePreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">File <span className="pp-req">*</span></span>
      <div className="pp-input pp-select"><span className="pp-ph">Enter a URL or upload a file</span><span className="pp-i pp-i-clip" /></div>
    </div>
  </div>
);

export const ColorPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Brand color</span>
      <div className="pp-row"><span className="pp-swatch" /><div className="pp-input" style={{ flex: 1 }}>#8142E3</div></div>
    </div>
  </div>
);

export const ArrayStringsPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Tags</span>
      <div className="pp-list">
        <div className="pp-kv pp-one"><div className="pp-input">tag1</div><span className="pp-iconbtn">×</span></div>
        <div className="pp-kv pp-one"><div className="pp-input">tag2</div><span className="pp-iconbtn">×</span></div>
      </div>
      <span className="pp-add">+ Add item</span>
    </div>
  </div>
);

export const ArrayFieldsPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Fields</span>
      <div className="pp-item">
        <span className="pp-rm">×</span>
        <div className="pp-field"><span className="pp-label" style={{ fontSize: '12.5px' }}>Field Name <span className="pp-req">*</span></span><div className="pp-input pp-ph">e.g. email</div></div>
        <div className="pp-field"><span className="pp-label" style={{ fontSize: '12.5px' }}>Field Type <span className="pp-req">*</span></span><div className="pp-input pp-select"><span>TEXT</span><span className="pp-caret" /></div></div>
      </div>
      <span className="pp-add">+ Add item</span>
    </div>
  </div>
);

/* ---------------- Dynamic ---------------- */

export const DropdownPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Board <span className="pp-req">*</span></span>
      <div className="pp-input pp-select">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a3a3a3' }}><span className="pp-i pp-i-search" /> Search a board…</span>
        <span className="pp-caret" />
      </div>
      <span className="pp-desc">Options load from the connected account.</span>
    </div>
  </div>
);

export const MultiSelectDropdownPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Labels <span className="pp-req">*</span></span>
      <div className="pp-input pp-select" style={{ height: 'auto', padding: '6px 10px' }}>
        <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className="pp-chip">Work <span className="pp-x">×</span></span>
          <span className="pp-chip">Important <span className="pp-x">×</span></span>
        </span>
        <span className="pp-caret" />
      </div>
    </div>
  </div>
);

export const DynamicPropertiesPreview = () => (
  <div className="pp">
    <div className="pp-field" style={{ gap: '12px' }}>
      <div className="pp-field"><span className="pp-label">Property 1 <span className="pp-req">*</span></span><div className="pp-input pp-ph">Enter property 1</div></div>
      <div className="pp-field"><span className="pp-label">Property 2</span><div className="pp-input pp-ph">0</div></div>
      <span className="pp-desc">Fields are built at runtime from the API response.</span>
    </div>
  </div>
);

export const CustomPreview = () => (
  <div className="pp">
    <div className="pp-field">
      <span className="pp-label">Custom Property <span className="pp-req">*</span></span>
      <div className="pp-input" style={{ borderStyle: 'dashed', color: '#737373' }}>Rendered by your own JS / DOM</div>
    </div>
  </div>
);

/* ---------------- New: layout & grouping ---------------- */

export const CheckboxRevealsPreview = () => {
  const [on, setOn] = useState(true);
  return (
    <div className="pp">
      <div className="pp-reveal">
        <label className="pp-switch-row" style={{ cursor: 'pointer' }} onClick={() => setOn((v) => !v)}>
          <span className={on ? 'pp-switch' : 'pp-switch pp-off'} />
          <span><span className="pp-t">Has attachment</span><span className="pp-d" style={{ display: 'block' }}>Only match emails with a file</span></span>
        </label>
        {on && (
          <div className="pp-divider">
            <div className="pp-field"><span className="pp-label" style={{ fontSize: '13px' }}>Attachment name</span><div className="pp-input pp-ph">e.g. invoice.pdf</div></div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DateRangePreview = () => {
  const presets = [
    { v: 'any_time', l: 'Any time' },
    { v: 'last_7_days', l: 'Last 7 days' },
    { v: 'last_30_days', l: 'Last 30 days' },
    { v: 'this_month', l: 'This month' },
    { v: 'custom', l: 'Custom' },
  ];
  const [sel, setSel] = useState('custom');
  return (
    <div className="pp">
      <div className="pp-field">
        <span className="pp-label">Date</span>
        <div className="pp-presets">
          {presets.map((p) => (
            <span key={p.v} className={sel === p.v ? 'pp-pill pp-sel' : 'pp-pill'} style={{ cursor: 'pointer' }} onClick={() => setSel(p.v)}>{p.l}</span>
          ))}
        </div>
        {sel === 'custom' && (
          <div className="pp-daterow">
            <div className="pp-col"><div className="pp-cl">After</div><div className="pp-input pp-ph">dd / mm / yyyy</div></div>
            <span style={{ color: '#a3a3a3', marginBottom: '8px' }}>→</span>
            <div className="pp-col"><div className="pp-cl">Before</div><div className="pp-input pp-ph">dd / mm / yyyy</div></div>
          </div>
        )}
      </div>
    </div>
  );
};

export const NumberStepperPreview = () => {
  const [n, setN] = useState(10);
  return (
    <div className="pp">
      <div className="pp-stepper-row">
        <span className="pp-label">Max results</span>
        <div className="pp-stepper">
          <button onClick={() => setN((v) => Math.max(1, v - 1))}>−</button>
          <span className="pp-val">{n}</span>
          <button onClick={() => setN((v) => v + 1)}>+</button>
        </div>
      </div>
    </div>
  );
};

export const CardsPreview = () => {
  const [sel, setSel] = useState('plain_text');
  const cards = [
    { v: 'plain_text', ic: '≡', t: 'Plain text', d: 'Simple' },
    { v: 'html', ic: '</>', t: 'HTML', d: 'Rich + styled' },
  ];
  return (
    <div className="pp">
      <div className="pp-field">
        <span className="pp-label">Body Type <span className="pp-req">*</span></span>
        <div className="pp-cards">
          {cards.map((c) => (
            <div key={c.v} className={sel === c.v ? 'pp-rcard pp-sel' : 'pp-rcard'} style={{ cursor: 'pointer' }} onClick={() => setSel(c.v)}>
              <span className="pp-ic">{c.ic}</span>
              <div><div className="pp-t">{c.t}</div><div className="pp-d">{c.d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const HalfWidthPreview = () => (
  <div className="pp">
    <div className="pp-twoup">
      <div className="pp-field"><span className="pp-label" style={{ fontSize: '13px' }}>First name</span><div className="pp-input pp-ph">Jane</div></div>
      <div className="pp-field"><span className="pp-label" style={{ fontSize: '13px' }}>Last name</span><div className="pp-input pp-ph">Doe</div></div>
    </div>
  </div>
);

export const SegmentedTabsPreview = () => {
  const [tab, setTab] = useState('to');
  const tabs = [{ v: 'to', l: 'To' }, { v: 'cc', l: 'Cc' }, { v: 'bcc', l: 'Bcc' }];
  return (
    <div className="pp">
      <div className="pp-field">
        <span className="pp-label">Recipients <span className="pp-req">*</span></span>
        <div className="pp-tabs">
          {tabs.map((t) => (
            <span key={t.v} className={tab === t.v ? 'pp-tab pp-sel' : 'pp-tab'} style={{ cursor: 'pointer' }} onClick={() => setTab(t.v)}>{t.l}</span>
          ))}
        </div>
        <div className="pp-chips">
          {tab === 'to' && <span className="pp-chip">boss@acme.com <span className="pp-x">×</span></span>}
          <span className="pp-ph">Type an email and press Enter</span>
        </div>
      </div>
    </div>
  );
};

export const FilterBuilderPreview = () => (
  <div className="pp" style={{ maxWidth: '620px' }}>
    <div className="pp-fb">
      <div className="pp-fb-row">
        <span className="pp-fb-badge"><span className="pp-i pp-i-user" /></span>
        <span className="pp-fb-lbl">From</span>
        <span className="pp-fb-ctrl"><div className="pp-input pp-ph">sender@example.com</div></span>
        <span className="pp-fb-x">×</span>
      </div>
      <div className="pp-fb-row">
        <span className="pp-fb-badge"><span className="pp-i pp-i-cal" /></span>
        <span className="pp-fb-lbl">Date</span>
        <span className="pp-fb-ctrl"><div className="pp-input pp-select"><span>Last 7 days</span><span className="pp-caret" /></div></span>
        <span className="pp-fb-x">×</span>
      </div>
      <div className="pp-fb-add">+ Add filter</div>
    </div>
    <div className="pp-fb-foot">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="pp-ic"><span className="pp-i pp-i-sliders" /></span>
        <div><div className="pp-t">Returns up to 10 results</div><div className="pp-s">2 filters applied · newest first</div></div>
      </div>
      <div className="pp-stepper"><button>−</button><span className="pp-val">10</span><button>+</button></div>
    </div>
  </div>
);
