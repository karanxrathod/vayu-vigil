import React, { useState, useEffect } from 'react';
import { Language, t } from '../lib/i18n';
import { 
  Cpu, Satellite, MessageSquare, Truck, RefreshCw, Zap, ShieldCheck, 
  AlertTriangle, CheckCircle2, Play, Send, Radio, Navigation, Eye, Check
} from 'lucide-react';

interface RoadmapViewProps {
  lang: Language;
  onExploreClick: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ lang }) => {
  const [activeSubTab, setActiveSubTab] = useState<'iot' | 'satellite' | 'bot' | 'fleet'>('iot');

  // IoT State
  const [iotNodes, setIotNodes] = useState<any[]>([]);
  const [loadingIot, setLoadingIot] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<string | null>(null);

  // Satellite State
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Bot State
  const [botHistory, setBotHistory] = useState<any[]>([]);
  const [botText, setBotText] = useState('Severe plastic waste burning near Sector 12 bus stop, very hard to breathe!');
  const [botChannel, setBotChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [botPhone, setBotPhone] = useState('+919876543210');
  const [sendingBot, setSendingBot] = useState(false);
  const [botReceipt, setBotReceipt] = useState<string | null>(null);

  // Fleet State
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [fleetActionMsg, setFleetActionMsg] = useState<string | null>(null);

  // Fetch data functions
  const fetchIot = async () => {
    setLoadingIot(true);
    try {
      const res = await fetch('/api/v1/infra/iot/nodes');
      if (res.ok) {
        const data = await res.json();
        setIotNodes(data.nodes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIot(false);
    }
  };

  const fetchSatellite = async () => {
    try {
      const res = await fetch('/api/v1/infra/satellite/anomalies');
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data.anomalies || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBot = async () => {
    try {
      const res = await fetch('/api/v1/infra/bot/history');
      if (res.ok) {
        const data = await res.json();
        setBotHistory(data.history || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFleet = async () => {
    setLoadingFleet(true);
    try {
      const res = await fetch('/api/v1/infra/fleet/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFleet(false);
    }
  };

  useEffect(() => {
    fetchIot();
    fetchSatellite();
    fetchBot();
    fetchFleet();
  }, []);

  // Handlers
  const handlePingNode = async (nodeId: string, currentPm25: number, currentPm10: number) => {
    setPingSuccess(null);
    try {
      // Simulate spike or update
      const newPm25 = Math.floor(currentPm25 + Math.random() * 50 - 10);
      const res = await fetch('/api/v1/infra/iot/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: nodeId,
          pm25: newPm25,
          pm10: newPm25 * 1.6,
          temperature: 32.5,
          humidity: 45
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPingSuccess(`⚡ MQTT Telemetry Published! ${data.node.name} updated PM2.5 to ${data.node.last_pm25} µg/m³.`);
        fetchIot();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerOrbitalScan = async () => {
    setScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch('/api/v1/infra/satellite/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ward_id: 'ward-1-sector-12' })
      });
      if (res.ok) {
        const data = await res.json();
        setScanMessage(`🛰️ ${data.message} Analyzed ${data.rasters_analyzed} Sentinel-5P TROPOMI Level-2 rasters over Delhi NCR.`);
        fetchSatellite();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleSendBotMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botText.trim()) return;
    setSendingBot(true);
    setBotReceipt(null);
    try {
      const res = await fetch('/api/v1/infra/bot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: botChannel,
          sender_phone: botPhone,
          text: botText,
          media_url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&auto=format&fit=crop&q=80'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBotReceipt(data.interaction.reply_sent);
        fetchBot();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingBot(false);
    }
  };

  const handleActivateSpraying = async (vehicleId: string) => {
    setFleetActionMsg(null);
    try {
      const res = await fetch('/api/v1/infra/fleet/arrived-spraying', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: vehicleId })
      });
      if (res.ok) {
        const data = await res.json();
        setFleetActionMsg(`💦 [WATER-MIST ACTIVATED] ${data.message}`);
        fetchFleet();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-br from-gray-900 via-primary-dark to-primary rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-400/20 px-3.5 py-1 rounded-full text-xs font-bold text-emerald-300 border border-emerald-400/30">
              <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>National Scaling & Municipal Pilot Grid (Live Control Center)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              City Infrastructure & AI Command Hub
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Interact live with Delhi's municipal IoT hardware grid, Copernicus Sentinel-5P orbital telemetry, Twilio low-bandwidth citizen channels, and automated GPS tanker fleet dispatch.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-black/30 p-2 rounded-2xl backdrop-blur-md border border-white/10">
            <button
              onClick={() => { fetchIot(); fetchSatellite(); fetchBot(); fetchFleet(); }}
              className="flex items-center space-x-2 bg-white text-primary-dark font-bold px-4 py-2 rounded-xl text-sm shadow hover:bg-emerald-50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync All Systems</span>
            </button>
          </div>
        </div>

        {/* Feature Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => setActiveSubTab('iot')}
            className={`flex items-center space-x-2 p-3 rounded-2xl font-bold text-xs sm:text-sm transition-all border ${
              activeSubTab === 'iot'
                ? 'bg-white text-primary-dark shadow-lg border-white'
                : 'bg-white/5 text-white/80 hover:bg-white/10 border-white/10'
            }`}
          >
            <Cpu className={`w-5 h-5 ${activeSubTab === 'iot' ? 'text-primary' : 'text-emerald-300'}`} />
            <span>1. IoT Hardware Grid</span>
          </button>

          <button
            onClick={() => setActiveSubTab('satellite')}
            className={`flex items-center space-x-2 p-3 rounded-2xl font-bold text-xs sm:text-sm transition-all border ${
              activeSubTab === 'satellite'
                ? 'bg-white text-primary-dark shadow-lg border-white'
                : 'bg-white/5 text-white/80 hover:bg-white/10 border-white/10'
            }`}
          >
            <Satellite className={`w-5 h-5 ${activeSubTab === 'satellite' ? 'text-primary' : 'text-cyan-300'}`} />
            <span>2. Satellite API (S5P)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bot')}
            className={`flex items-center space-x-2 p-3 rounded-2xl font-bold text-xs sm:text-sm transition-all border ${
              activeSubTab === 'bot'
                ? 'bg-white text-primary-dark shadow-lg border-white'
                : 'bg-white/5 text-white/80 hover:bg-white/10 border-white/10'
            }`}
          >
            <MessageSquare className={`w-5 h-5 ${activeSubTab === 'bot' ? 'text-primary' : 'text-green-300'}`} />
            <span>3. WhatsApp / SMS Bot</span>
          </button>

          <button
            onClick={() => setActiveSubTab('fleet')}
            className={`flex items-center space-x-2 p-3 rounded-2xl font-bold text-xs sm:text-sm transition-all border ${
              activeSubTab === 'fleet'
                ? 'bg-white text-primary-dark shadow-lg border-white'
                : 'bg-white/5 text-white/80 hover:bg-white/10 border-white/10'
            }`}
          >
            <Truck className={`w-5 h-5 ${activeSubTab === 'fleet' ? 'text-primary' : 'text-amber-300'}`} />
            <span>4. Fleet GPS Dispatch</span>
          </button>
        </div>
      </div>

      {/* TAB 1: IoT Hardware Grid */}
      {activeSubTab === 'iot' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Cpu className="w-6 h-6 text-primary" />
                <span>DPCC & CPCB IoT Hardware Sensor Grid</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Direct MQTT broker telemetry from municipal PM2.5/PM10 air quality sensors deployed on streetlights and bus shelters across wards.
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-300 self-start sm:self-auto">
              Live MQTT Broker: Connected
            </span>
          </div>

          {pingSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{pingSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {iotNodes.map((node) => (
              <div key={node.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:border-primary/40 transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                      {node.type.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mt-1">{node.name}</h4>
                    <div className="text-[11px] font-mono text-gray-500 mt-0.5">Topic: {node.mqtt_topic}</div>
                  </div>
                  <span className="flex items-center space-x-1 bg-green-100 text-green-800 font-bold text-[10px] px-2 py-1 rounded-full uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>{node.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-gray-100 text-center">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">PM2.5</div>
                    <div className={`text-base font-extrabold ${node.last_pm25 > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                      {node.last_pm25} <span className="text-[10px] font-normal">µg/m³</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">PM10</div>
                    <div className="text-base font-extrabold text-gray-900">
                      {node.last_pm10} <span className="text-[10px] font-normal">µg/m³</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Signal / Batt</div>
                    <div className="text-xs font-bold text-emerald-700 mt-1">
                      {node.rssi_dbm} dBm | {node.battery}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400 font-medium">Firmware: {node.firmware_version}</span>
                  <button
                    onClick={() => handlePingNode(node.id, node.last_pm25, node.last_pm10)}
                    className="bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Ping & Ingest Reading</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Satellite API */}
      {activeSubTab === 'satellite' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Satellite className="w-6 h-6 text-cyan-600" />
                <span>Copernicus Sentinel-5P Earth Engine API</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Automated daily ingestion of Sentinel-5P Nitrogen Dioxide (NO₂) and Aerosol Optical Depth (AOD) imagery to detect large-scale agricultural burning and industrial plumes.
              </p>
            </div>
            <button
              onClick={handleTriggerOrbitalScan}
              disabled={scanning}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold px-4 py-2 rounded-2xl shadow-md text-sm flex items-center space-x-2 transition-all self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Scanning Orbital Rasters...' : '🛰️ Trigger Orbital Overpass Scan'}</span>
            </button>
          </div>

          {scanMessage && (
            <div className="bg-cyan-50 border border-cyan-300 text-cyan-900 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-600 flex-shrink-0" />
              <span>{scanMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.map((a) => (
              <div key={a.id} className="p-5 rounded-2xl border border-gray-200 bg-cyan-50/20 hover:border-cyan-400 transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">
                      {a.pollutant.replace(/_/g, ' ')}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mt-1">{a.instrument}</h4>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">Satellite: {a.satellite}</div>
                  </div>
                  <span className="bg-red-100 text-red-800 font-extrabold text-xs px-2.5 py-1 rounded-full border border-red-300">
                    Index: {a.anomaly_score}/100
                  </span>
                </div>

                <p className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100 italic">
                  "{a.description}"
                </p>

                <div className="flex items-center justify-between pt-1 text-xs font-semibold text-gray-600">
                  <span>Max Column: <strong>{a.max_value_unit}</strong></span>
                  <span className="text-emerald-700">Conf: {Math.round(a.confidence * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WhatsApp & SMS Bot */}
      {activeSubTab === 'bot' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <MessageSquare className="w-6 h-6 text-green-600" />
                <span>WhatsApp & SMS Reporting Bot (Twilio Low-Bandwidth Channel)</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Allows citizens in rural or low-bandwidth areas to report garbage dump fires simply by texting a photo and location to an official WhatsApp bot without downloading an app.
              </p>
            </div>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full border border-green-300 self-start sm:self-auto">
              Twilio API Hook: Active (+91-8800-CLEAN)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Simulator Form */}
            <div className="lg:col-span-5 bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                <span>📱</span>
                <span>Test Live WhatsApp / SMS Bot Simulator</span>
              </h3>
              <form onSubmit={handleSendBotMessage} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Channel</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBotChannel('whatsapp')}
                      className={`py-1.5 rounded-xl font-bold text-xs border ${botChannel === 'whatsapp' ? 'bg-green-600 text-white border-green-700 shadow' : 'bg-white text-gray-700 border-gray-300'}`}
                    >
                      WhatsApp Bot
                    </button>
                    <button
                      type="button"
                      onClick={() => setBotChannel('sms')}
                      className={`py-1.5 rounded-xl font-bold text-xs border ${botChannel === 'sms' ? 'bg-blue-600 text-white border-blue-700 shadow' : 'bg-white text-gray-700 border-gray-300'}`}
                    >
                      SMS Text Bot
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Citizen Phone</label>
                  <input
                    type="text"
                    value={botPhone}
                    onChange={(e) => setBotPhone(e.target.value)}
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Message Text & Preset</label>
                  <textarea
                    value={botText}
                    onChange={(e) => setBotText(e.target.value)}
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setBotText('Severe plastic waste burning near Sector 12 bus stop, very hard to breathe!')}
                      className="text-[10px] bg-white hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded font-medium text-gray-700"
                    >
                      🔥 Preset: Garbage Fire
                    </button>
                    <button
                      type="button"
                      onClick={() => setBotText('Heavy road dust flying from unpaved construction near Sector 9 market area.')}
                      className="text-[10px] bg-white hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded font-medium text-gray-700"
                    >
                      💨 Preset: Road Dust
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingBot}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingBot ? 'Processing via Twilio & Gemini AI...' : 'Send to Official Municipal Bot'}</span>
                </button>
              </form>

              {botReceipt && (
                <div className="bg-green-100/80 border border-green-300 p-3.5 rounded-xl text-xs text-green-900 font-medium space-y-1">
                  <div className="font-bold flex items-center space-x-1">
                    <Check className="w-4 h-4 text-green-700" />
                    <span>Automated Receipt & AI Verification:</span>
                  </div>
                  <p className="italic text-[11px] leading-relaxed bg-white/80 p-2 rounded border border-green-200">{botReceipt}</p>
                </div>
              )}
            </div>

            {/* History Queue */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center justify-between">
                <span>Recent Live Bot Interactions</span>
                <span className="text-xs font-normal text-gray-500">{botHistory.length} messages logged</span>
              </h3>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {botHistory.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold px-2 py-0.5 rounded uppercase text-[10px] ${item.channel === 'whatsapp' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {item.channel}
                        </span>
                        <span className="font-mono font-bold text-gray-800">{item.sender_phone}</span>
                        <span className="text-primary font-bold">#{item.tracking_id}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        AI {Math.round(item.ai_confidence * 100)}% ({item.detected_category})
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 font-medium bg-white p-2.5 rounded-xl border border-gray-100">
                      "{item.message_text}"
                    </p>
                    <div className="text-[11px] text-gray-600 italic bg-green-50/50 p-2 rounded-lg border border-green-100">
                      <strong>Bot Reply:</strong> {item.reply_sent}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Automated Municipal Fleet Dispatch */}
      {activeSubTab === 'fleet' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Truck className="w-6 h-6 text-amber-600" />
                <span>Automated Municipal Fleet Dispatch & Smart GPS Routing</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                GPS integration with municipal water-mist tankers, smog towers, and sanitation vehicles automatically dispatched to critical hotspots when risk scores exceed threshold.
              </p>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-300 self-start sm:self-auto">
              Smart Routing Grid: Active
            </span>
          </div>

          {fleetActionMsg && (
            <div className="bg-amber-50 border border-amber-300 text-amber-950 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>{fleetActionMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((v) => {
              const isDispatched = v.status === 'dispatched_en_route';
              const isSpraying = v.status === 'spraying_active';
              return (
                <div key={v.id} className="p-5 rounded-2xl border border-gray-200 bg-amber-50/10 hover:border-amber-400 transition-all space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                        {v.type.replace(/_/g, ' ')}
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm mt-1">{v.name}</h4>
                      <div className="text-[11px] font-mono text-gray-500 mt-0.5">Reg: {v.vehicle_number} | Ward: {v.ward_id}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      isSpraying ? 'bg-cyan-100 text-cyan-800 border-cyan-300 animate-pulse' :
                      isDispatched ? 'bg-amber-100 text-amber-800 border-amber-300 animate-bounce' :
                      'bg-gray-100 text-gray-700 border-gray-300'
                    }`}>
                      {v.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {v.assigned_hotspot_name ? (
                    <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                      <div className="text-amber-900 font-bold flex items-center space-x-1">
                        <Navigation className="w-3.5 h-3.5 text-amber-600" />
                        <span>Assigned Target: {v.assigned_hotspot_name}</span>
                      </div>
                      <div className="text-gray-600 text-[11px]">
                        Speed: {v.speed_kmh} km/h | ETA: <strong>{v.eta_minutes} minutes</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-500 italic">
                      Currently idle at sector municipal depot. Ready for automated dispatch.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Water / Mist Tank</div>
                      <div className="font-extrabold text-cyan-700">{v.water_tank_level}%</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Fuel Level</div>
                      <div className="font-extrabold text-gray-800">{v.fuel_level}%</div>
                    </div>
                  </div>

                  <div className="pt-1">
                    {isDispatched ? (
                      <button
                        onClick={() => handleActivateSpraying(v.id)}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-2 rounded-xl text-xs shadow transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span>💦 Simulate Arrival & Activate Water-Mist Sprinkling</span>
                      </button>
                    ) : isSpraying ? (
                      <div className="text-center text-xs font-bold text-cyan-700 bg-cyan-50 py-2 rounded-xl border border-cyan-200">
                        ✅ Water-Mist Cannon Active — PM2.5 Dropping Rapidly
                      </div>
                    ) : (
                      <div className="text-center text-xs font-semibold text-gray-500 py-1">
                        Standing by for automated Smart Routing assignment
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
