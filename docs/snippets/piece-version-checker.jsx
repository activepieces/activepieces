export const PieceVersionChecker = () => {
  const releases = ["0.50.0","0.50.1","0.50.2","0.50.3","0.50.4","0.50.5","0.50.6","0.50.7","0.50.8","0.50.9","0.50.10","0.50.11","0.50.12","0.51.0","0.52.0","0.52.1","0.52.2","0.52.3","0.52.4","0.52.5","0.53.0","0.53.1","0.54.0","0.55.0","0.56.0","0.57.0","0.57.1","0.58.0","0.59.0","0.59.1","0.60.0","0.60.1","0.60.2","0.61.0","0.62.0","0.63.0","0.63.1","0.64.0","0.64.1","0.64.2","0.65.0","0.66.0","0.66.1","0.66.2","0.66.3","0.66.4","0.66.5","0.66.6","0.66.7","0.67.0","0.67.1","0.67.2","0.67.3","0.67.4","0.67.5","0.67.6","0.68.0","0.68.1","0.68.2","0.68.3","0.69.0","0.70.0","0.70.1","0.70.2","0.70.3","0.70.4","0.70.5","0.70.6","0.70.7","0.70.8","0.71.0","0.71.1","0.71.2","0.71.3","0.71.4","0.72.0","0.72.1","0.72.2","0.72.3","0.72.4","0.73.0","0.74.0","0.74.1","0.74.2","0.74.3","0.74.4","0.75.0","0.76.0","0.76.1","0.76.2","0.77.0","0.77.1","0.77.2","0.77.3","0.77.4","0.77.5","0.77.6","0.77.7","0.77.8","0.78.0","0.78.1","0.78.2","0.79.0","0.79.1","0.79.2","0.79.3","0.79.4","0.80.0","0.80.1","0.81.0","0.81.1","0.81.2","0.81.3","0.81.4","0.82.0","0.82.1","0.82.2","0.82.3","0.83.0","0.83.1","0.84.0","0.85.0","0.85.2","0.85.3","0.85.4","0.85.5","0.86.0","0.86.1","0.86.2","0.86.3","0.87.0","0.87.1","0.87.2","0.87.3","0.88.0","0.88.1","0.88.2","0.88.3","0.88.4","0.89.0","0.90.0","0.90.1","0.90.2","0.91.0","0.91.1","0.91.2","0.91.3","0.91.4","0.92.0","0.92.1"];
  const versions = [
    { name: '0.0.1 – 0.9.5', min: '0.50.0' },
    { name: '0.10.0 – 0.10.17', min: '0.66.7' },
    { name: '0.10.18 – 0.13.0', min: '0.73.0' },
    { name: '0.14.0 – 0.16.3', min: '0.79.0' },
    { name: '0.16.4 – 0.17.4', min: '0.82.0' },
    { name: '0.17.6 – 0.19.0', min: '0.87.0' },
    { name: '0.20.0 – 0.21.0', min: '0.88.2' },
  ];
  const ticks = ['0.50.0', '0.60.0', '0.70.0', '0.80.0', '0.90.0'];
  const lastIndex = releases.length - 1;

  const [instanceIndex, setInstanceIndex] = useState(releases.indexOf('0.50.0'));

  const toPercent = (release) => (releases.indexOf(release) / lastIndex) * 100;
  const instancePercent = (instanceIndex / lastIndex) * 100;
  const isSynced = (version) => releases.indexOf(version.min) <= instanceIndex;

  return (
    <div className="vr">
      <div className="vr-intro">
        An example with the Slack piece, from a snapshot of the piece registry. It explains how piece versions are matched to Activepieces releases.
      </div>

      <div className="vr-row">
        <div className="vr-head">Slack versions</div>
        <div className="vr-lane">
          <span className="vr-marker-label" style={{ left: `${instancePercent}%` }}>instance version</span>
        </div>
      </div>

      <div className="vr-row">
        <div className="vr-labels">
          {versions.map((version) => (
            <div className="vr-label" key={version.name}>
              <span className="vr-name">{version.name}</span>
              <span className={isSynced(version) ? 'vr-status vr-status-on' : 'vr-status vr-status-off'}>
                {isSynced(version) ? 'synced' : 'left out'}
              </span>
            </div>
          ))}
        </div>
        <div className="vr-lane vr-bars">
          <div className="vr-marker" style={{ left: `${instancePercent}%` }} />
          {versions.map((version) => (
            <div className="vr-track" key={version.name}>
              <div
                className={[
                  'vr-bar',
                  isSynced(version) ? 'vr-bar-on' : 'vr-bar-off',
                  toPercent(version.min) > 75 ? 'vr-bar-short' : '',
                ].join(' ')}
                style={{ left: `${toPercent(version.min)}%`, width: `${100 - toPercent(version.min)}%` }}
              >
                <span className="vr-bar-text">{version.min}+</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="vr-row">
        <div />
        <div className="vr-lane">
          <div className="vr-axis">
            {ticks.map((tick) => (
              <span className="vr-tick" key={tick} style={{ left: `${toPercent(tick)}%` }}>
                {tick}
              </span>
            ))}
          </div>
          <div className="vr-axis-caption">Instance version →</div>
        </div>
      </div>

      <label className="vr-control">
        <span className="vr-control-label">Instance version</span>
        <input
          className="vr-slider"
          type="range"
          min={0}
          max={lastIndex}
          step={1}
          value={instanceIndex}
          onChange={(event) => setInstanceIndex(Number(event.target.value))}
        />
        <span className="vr-control-value">{releases[instanceIndex]}</span>
      </label>
    </div>
  );
};
