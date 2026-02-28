import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic2, 
  Settings2, 
  History, 
  Download, 
  Play, 
  Pause, 
  Trash2, 
  AlertCircle, 
  ChevronDown,
  Sparkles,
  Volume2,
  Loader2,
  Coins,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Slider } from './components/Slider';
import axios from 'axios';

interface Voice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
}

interface Model {
  model_id: string;
  name: string;
}

interface HistoryItem {
  id: string;
  text: string;
  voiceName: string;
  timestamp: number;
  audioUrl: string;
  index: number;
}

export default function App() {
  const [text, setText] = useState('');
  const [scenes, setScenes] = useState<string[]>(['']);
  const [isSceneMode, setIsSceneMode] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [selectedModel, setSelectedModel] = useState('eleven_multilingual_v2');
  const [stability, setStability] = useState(50);
  const [similarity, setSimilarity] = useState(75);
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [credits, setCredits] = useState(300000);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isUsingMock, setIsUsingMock] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('elevenlabs_api_key');
    if (savedKey) setApiKey(savedKey);
    
    fetchVoices(savedKey);
    fetchModels(savedKey);
    
    // Load history from local storage
    const savedHistory = localStorage.getItem('tts_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const fetchVoices = async (key?: string) => {
    try {
      const headers = (key || apiKey) ? { 'x-elevenlabs-key': key || apiKey } : {};
      const res = await axios.get('/api/voices', { headers });
      setVoices(res.data.voices);
      setIsUsingMock(res.data.is_mock);
      if (res.data.voices.length > 0 && !selectedVoice) setSelectedVoice(res.data.voices[0].voice_id);
    } catch (err) {
      console.warn("Failed to fetch voices, using mock data.");
      setIsUsingMock(true);
    }
  };

  const fetchModels = async (key?: string) => {
    try {
      const headers = (key || apiKey) ? { 'x-elevenlabs-key': key || apiKey } : {};
      const res = await axios.get('/api/models', { headers });
      setModels(res.data);
    } catch (err) {
      console.warn("Failed to fetch models, using mock data.");
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem('elevenlabs_api_key', newKey);
    // Refresh voices and models when key changes
    fetchVoices(newKey);
    fetchModels(newKey);
  };

  const addScene = () => setScenes([...scenes, '']);
  const removeScene = (index: number) => {
    if (scenes.length > 1) {
      const newScenes = [...scenes];
      newScenes.splice(index, 1);
      setScenes(newScenes);
    }
  };
  const updateScene = (index: number, val: string) => {
    const newScenes = [...scenes];
    newScenes[index] = val;
    setScenes(newScenes);
  };

  const generateTTS = async (inputText: string, autoDownload = false) => {
    if (!inputText.trim()) return null;

    const costPerChar = selectedModel === 'eleven_v3_alpha' ? 2 : 1;
    const totalCost = inputText.length * costPerChar;

    if (totalCost > credits) {
      throw new Error("Không đủ điểm để tạo!");
    }

    const headers = apiKey ? { 'x-elevenlabs-key': apiKey } : {};
    const response = await axios.post('/api/tts', {
      text: inputText,
      voiceId: selectedVoice,
      modelId: selectedModel,
      settings: {
        stability: stability / 100,
        similarity_boost: similarity / 100,
        speed: speed
      }
    }, {
      headers,
      responseType: 'blob',
      validateStatus: (status) => status < 500
    });

    if (response.status >= 400 || response.data.type === 'application/json') {
      const blob = response.data;
      const errorText = await blob.text();
      let errorMessage = "Failed to generate speech";
      try {
        const errorData = typeof errorText === 'string' ? JSON.parse(errorText) : errorText;
        errorMessage = errorData.error || errorData.detail?.message || (typeof errorData === 'string' ? errorData : errorMessage);
      } catch (e) {
        errorMessage = (typeof errorText === 'string' && errorText.length > 0) ? errorText : errorMessage;
      }
      if (response.status === 401) {
        setIsUsingMock(true);
        throw new Error("API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cài đặt.");
      }
      if (typeof errorMessage !== 'string') errorMessage = JSON.stringify(errorMessage);
      throw new Error(errorMessage);
    }

    const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const voiceName = voices.find(v => v.voice_id === selectedVoice)?.name || 'Unknown';
    const totalCreated = parseInt(localStorage.getItem('tts_total_created') || '0') + 1;
    localStorage.setItem('tts_total_created', totalCreated.toString());

    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: inputText.length > 50 ? inputText.substring(0, 50) + '...' : inputText,
      voiceName,
      timestamp: Date.now(),
      audioUrl,
      index: totalCreated
    };

    if (autoDownload) {
      const link = document.createElement('a');
      link.href = audioUrl;
      const paddedIndex = totalCreated.toString().padStart(3, '0');
      link.download = `${paddedIndex}_${voiceName}.mp3`;
      link.click();
    }

    return { newItem, totalCost };
  };

  const handlePreview = async () => {
    if (previewLoading) return;
    setPreviewLoading(true);
    try {
      const voice = voices.find(v => v.voice_id === selectedVoice);
      const previewText = `Xin chào, tôi là ${voice?.name || 'giọng đọc này'}. Rất vui được gặp bạn!`;
      const result = await generateTTS(previewText, false);
      if (result && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = result.newItem.audioUrl;
        audioRef.current.load();
        audioRef.current.play();
        setPlayingId(result.newItem.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isSceneMode) {
        const validScenes = scenes.filter(s => s.trim().length > 0);
        if (validScenes.length === 0) {
          setError("Vui lòng nhập nội dung cho ít nhất một scene");
          setLoading(false);
          return;
        }

        let currentHistory = [...history];
        let currentCredits = credits;

        for (const sceneText of validScenes) {
          const result = await generateTTS(sceneText, true);
          if (result) {
            currentHistory = [result.newItem, ...currentHistory];
            currentCredits -= result.totalCost;
            setHistory(currentHistory);
            setCredits(currentCredits);
            localStorage.setItem('tts_history', JSON.stringify(currentHistory));
          }
        }
      } else {
        if (!text.trim()) {
          setError("Vui lòng nhập văn bản");
          setLoading(false);
          return;
        }
        const result = await generateTTS(text, false);
        if (result) {
          const updatedHistory = [result.newItem, ...history];
          setHistory(updatedHistory);
          setCredits(prev => prev - result.totalCost);
          localStorage.setItem('tts_history', JSON.stringify(updatedHistory));
          
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = result.newItem.audioUrl;
            audioRef.current.load();
            audioRef.current.play().catch(e => console.error("Playback failed:", e));
            setPlayingId(result.newItem.id);
          }
        }
      }
    } catch (err: any) {
      console.error("TTS Error:", err);
      setError(err.message || "Lỗi khi tạo giọng nói. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (item: HistoryItem) => {
    if (playingId === item.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = item.audioUrl;
        audioRef.current.play();
        setPlayingId(item.id);
      }
    }
  };

  const deleteHistory = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('tts_history', JSON.stringify(updated));
  };

  const downloadAudio = (item: HistoryItem) => {
    const link = document.createElement('a');
    link.href = item.audioUrl;
    const index = item.index || 0;
    const paddedIndex = index.toString().padStart(3, '0');
    link.download = `${paddedIndex}_${item.voiceName}.mp3`;
    link.click();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingId(null)} 
        className="hidden" 
      />

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-brand-purple mb-2"
          >
            <Sparkles size={20} />
            <span className="text-sm font-bold tracking-widest uppercase">AI Voice Engine</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white tracking-tight"
          >
            Eleven<span className="text-brand-purple">Labs</span> Clone
          </motion.h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 border-brand-purple/20"
        >
          <div className="bg-brand-purple/20 p-2 rounded-xl text-brand-purple">
            <Coins size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Credits Remaining</p>
            <p className="text-lg font-mono font-bold text-white">{credits.toLocaleString()}</p>
          </div>
        </motion.div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl p-6 flex flex-col h-[500px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mic2 size={18} />
                  <span className="text-sm font-medium">Văn bản cần chuyển đổi</span>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl">
                  <button 
                    onClick={() => setIsSceneMode(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${!isSceneMode ? 'bg-brand-purple text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Đơn lẻ
                  </button>
                  <button 
                    onClick={() => setIsSceneMode(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${isSceneMode ? 'bg-brand-purple text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Theo Scene
                  </button>
                </div>
              </div>
              <div className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                {isSceneMode ? scenes.reduce((acc, s) => acc + s.length, 0) : text.length} ký tự
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {!isSceneMode ? (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập nội dung bạn muốn chuyển thành giọng nói tại đây..."
                  className="w-full h-full bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder:text-slate-700"
                />
              ) : (
                <div className="space-y-4">
                  {scenes.map((scene, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative group"
                    >
                      <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-brand-purple/20 flex items-center justify-center text-[10px] font-bold text-brand-purple border border-brand-purple/30">
                        {idx + 1}
                      </div>
                      <div className="flex gap-2">
                        <textarea
                          value={scene}
                          onChange={(e) => updateScene(idx, e.target.value)}
                          placeholder={`Nội dung scene ${idx + 1}...`}
                          className="w-full bg-white/5 rounded-2xl p-4 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-brand-purple/50 transition-all text-sm leading-relaxed placeholder:text-slate-700"
                        />
                        <button 
                          onClick={() => removeScene(idx)}
                          className="p-2 text-slate-600 hover:text-red-400 transition-colors self-start mt-2 opacity-0 group-hover:opacity-100"
                          title="Xóa scene"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  <button 
                    onClick={addScene}
                    className="w-full py-3 border-2 border-dashed border-white/5 rounded-2xl text-slate-500 hover:text-brand-purple hover:border-brand-purple/30 transition-all text-xs font-bold flex items-center justify-center gap-2"
                  >
                    + Thêm Scene mới
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={() => isSceneMode ? setScenes(['']) : setText('')}
                  className="btn-secondary text-xs"
                >
                  Xóa hết
                </button>
              </div>
              
              <button 
                onClick={handleGenerate}
                disabled={loading || (isSceneMode ? scenes.every(s => !s.trim()) : !text.trim())}
                className="btn-primary min-w-[200px] flex items-center justify-center gap-2 animate-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>{isSceneMode ? 'Đang xử lý các scene...' : 'Đang xử lý...'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={20} />
                    <span>{isSceneMode ? 'Tạo & Tải tất cả Scene' : 'Tạo giọng nói'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400"
              >
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 px-2">
              <History size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Lịch sử đã tạo</span>
            </div>
            
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 text-center text-slate-600 italic">
                  Chưa có lịch sử tạo giọng nói
                </div>
              ) : (
                history.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-panel rounded-2xl p-4 flex items-center justify-between group hover:border-brand-purple/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => togglePlay(item)}
                        className="w-12 h-12 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center hover:bg-brand-purple hover:text-white transition-all"
                      >
                        {playingId === item.id ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      <div>
                        <p className="text-white font-medium line-clamp-1">{item.text}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                            #{item.index?.toString().padStart(3, '0') || '000'}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded">
                            {item.voiceName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => downloadAudio(item)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Tải xuống"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => deleteHistory(item.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="lg:col-span-5">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel rounded-3xl p-8 sticky top-8 space-y-8"
          >
            <div className="flex items-center gap-2 text-white">
              <Settings2 size={20} className="text-brand-purple" />
              <h2 className="text-xl font-bold">Cài đặt giọng nói</h2>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Key size={14} /> ElevenLabs API Key
                </label>
                <button 
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Nhập API Key của bạn..."
                className={`w-full input-field text-sm ${apiKey && isUsingMock ? 'border-yellow-500/50' : ''}`}
              />
              {apiKey && isUsingMock && (
                <p className="text-[10px] text-yellow-500 italic flex items-center gap-1">
                  <AlertCircle size={10} /> API Key không hợp lệ hoặc đã hết hạn. Đang dùng Mock API.
                </p>
              )}
              {!apiKey && (
                <p className="text-[10px] text-slate-500 italic">
                  * Hệ thống sẽ dùng Mock API nếu không có Key.
                </p>
              )}
            </div>

            {/* Voice Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-400">Chọn giọng đọc</label>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePreview}
                    disabled={previewLoading || !selectedVoice}
                    className="text-[10px] font-bold text-brand-purple hover:text-white transition-colors flex items-center gap-1 bg-brand-purple/10 px-2 py-0.5 rounded-lg border border-brand-purple/20"
                    title="Nghe thử giọng đang chọn"
                  >
                    {previewLoading ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                    Nghe thử
                  </button>
                  <button 
                    onClick={() => {
                      const randomVoice = voices[Math.floor(Math.random() * voices.length)];
                      if (randomVoice) setSelectedVoice(randomVoice.voice_id);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10"
                    title="Chọn ngẫu nhiên một giọng"
                  >
                    <Sparkles size={10} />
                    Ngẫu nhiên
                  </button>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {voices.length} giọng
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-purple transition-colors">
                  <Mic2 size={14} />
                </div>
                <input 
                  type="text"
                  placeholder="Tìm kiếm giọng đọc..."
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-t-xl px-9 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-purple/30 transition-all"
                />
                {voiceSearch && (
                  <button 
                    onClick={() => setVoiceSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <div className="relative">
                <select 
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full input-field appearance-none cursor-pointer pr-10 rounded-t-none border-t-0"
                >
                  {voices
                    .filter(v => v.name.toLowerCase().includes(voiceSearch.toLowerCase()) || 
                                v.labels?.description?.toLowerCase().includes(voiceSearch.toLowerCase()))
                    .map(voice => (
                      <option key={voice.voice_id} value={voice.voice_id}>
                        {voice.name} {voice.labels?.gender === 'female' ? '♀' : '♂'} ({voice.labels?.description || 'Giọng đọc'})
                      </option>
                    ))
                  }
                  {voices.filter(v => v.name.toLowerCase().includes(voiceSearch.toLowerCase()) || 
                                v.labels?.description?.toLowerCase().includes(voiceSearch.toLowerCase())).length === 0 && (
                    <option disabled>Không tìm thấy giọng đọc</option>
                  )}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-400">Model</label>
              <div className="relative">
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full input-field appearance-none cursor-pointer pr-10"
                >
                  {models.map(model => (
                    <option key={model.model_id} value={model.model_id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
              </div>
              {selectedModel === 'eleven_v3_alpha' && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-amber-400 bg-amber-400/10 p-2 rounded-xl border border-amber-400/20">
                  <AlertCircle size={14} />
                  <span>Model V3 tính phí 2 điểm/ký tự</span>
                </div>
              )}
            </div>

            {/* Sliders */}
            <div className="space-y-8 pt-4">
              <Slider 
                label="Tốc độ"
                value={speed}
                min={0.5}
                max={2.0}
                step={0.1}
                onChange={setSpeed}
                suffix="x"
              />
              <Slider 
                label="Sự ổn định (Stability)"
                value={stability}
                min={0}
                max={100}
                onChange={setStability}
                suffix="%"
              />
              <Slider 
                label="Sự tương đồng (Similarity)"
                value={similarity}
                min={0}
                max={100}
                onChange={setSimilarity}
                suffix="%"
              />
            </div>

            {/* Cost Summary */}
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Chi phí ước tính:</span>
                <span className="text-white">
                  {(text.length * (selectedModel === 'eleven_v3_alpha' ? 2 : 1)).toLocaleString()} điểm
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Số dư sau khi tạo:</span>
                <span className={credits - (text.length * (selectedModel === 'eleven_v3_alpha' ? 2 : 1)) < 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {(credits - (text.length * (selectedModel === 'eleven_v3_alpha' ? 2 : 1))).toLocaleString()} điểm
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer / Info */}
      <footer className="max-w-7xl mx-auto mt-20 text-center text-slate-600 text-sm border-t border-white/5 pt-8 pb-12">
        <p>© 2024 ElevenLabs Clone. Powered by ElevenLabs API.</p>
        <p className="mt-1">Thiết kế bởi AI Studio Assistant</p>
      </footer>
    </div>
  );
}
