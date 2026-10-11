import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, MapPin, Plane, TriangleAlert } from 'lucide-react';

type Status = { mapsConfigured: boolean; hasSettings: boolean };

export function MapsStatusCard() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/pricing', { headers: { Accept: 'application/json' } })
      .then(res => res.json())
      .then((data: Status) => active && setStatus(data))
      .catch(() => active && setStatus({ mapsConfigured: false, hasSettings: false }));
    return () => { active = false; };
  }, []);

  const configured = status?.mapsConfigured;

  return (
    <div className={`dash-card maps-card ${configured ? 'ok' : 'setup'}`}>
      <div className="dash-card-head">
        <span className="dash-card-icon">{configured ? <CheckCircle2 size={18} /> : <KeyRound size={18} />}</span>
        <div><h2>Mapping &amp; live distance</h2><p>Google Maps integration status</p></div>
      </div>

      {configured ? (
        <div className="maps-state">
          <div className="maps-state-row"><CheckCircle2 size={16} /> <span>Google Maps API key detected</span></div>
          <ul className="maps-features">
            <li><MapPin size={14} /> Real-time address autocomplete</li>
            <li><Plane size={14} /> Airport-code &amp; location validation</li>
            <li><span className="dot" /> Driving distance &amp; live fare estimates</li>
          </ul>
        </div>
      ) : (
        <div className="maps-state">
          <div className="maps-state-row warn"><TriangleAlert size={16} /> <span>Running in fallback mode</span></div>
          <p className="maps-desc">No Google Maps API key is set. Airport codes (JFK, LAX, ORD…) still validate and resolve, but live address autocomplete and driving-distance fares are unavailable until you add a key.</p>
          <ol className="maps-steps">
            <li><strong>Open</strong> the Google Cloud Console → APIs &amp; Services → Credentials.</li>
            <li><strong>Enable</strong> the Places API and Distance Matrix API.</li>
            <li><strong>Create</strong> an API key and restrict it to your domain.</li>
            <li><strong>Paste</strong> the key as <code>GOOGLE_MAPS_API_KEY</code> in <code>apps/web/.env</code>, then reload the app.</li>
          </ol>
          <div className="maps-features">
            <span className="badge-ok"><Plane size={13} /> Airport codes work now</span>
            <span className="badge-off"><MapPin size={13} /> Live addresses need a key</span>
          </div>
        </div>
      )}
    </div>
  );
}
