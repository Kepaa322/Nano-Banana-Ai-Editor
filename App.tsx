import React, { useState, useRef, useEffect } from 'react';
import { 
  ImageSize, 
  AspectRatio, 
  CameraAngle, 
  TimeOfDay, 
  Season, 
  ArtStyle, 
  GenerationSettings,
  RotationMode
} from './types';
import Cube3D from './components/Cube3D';
import ImageEditor from './components/ImageEditor';
import { generateImage, enhancePrompt } from './services/geminiService';
import { 
  Upload, 
  Image as ImageIcon, 
  Download, 
  Wand2, 
  Loader2, 
  Settings2,
  Trash2,
  Brush,
  Palette,
  ImagePlus,
  Video,
  Box,
  Key,
  X,
  Sparkles
} from 'lucide-react';

const App: React.FC = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // Base64
  const [maskImage, setMaskImage] = useState<string | null>(null); // Base64
  const [referenceImage, setReferenceImage] = useState<string | null>(null); // Base64
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  
  // Settings
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.Size1K);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Square);
  const [cameraAngles, setCameraAngles] = useState<CameraAngle[]>([]);
  const [rotationMode, setRotationMode] = useState<RotationMode>(RotationMode.Camera);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [style, setStyle] = useState<ArtStyle | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Load API Key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('user_gemini_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('user_gemini_api_key', apiKey);
    setShowKeyModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setUploadedImage(result.split(',')[1]);
        setMaskImage(null); // Reset mask on new upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setReferenceImage(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAngleToggle = (angle: CameraAngle) => {
    setCameraAngles(prev => {
      if (prev.includes(angle)) {
        return prev.filter(a => a !== angle);
      } else {
        return [...prev, angle];
      }
    });
  };

  const handleMagicPrompt = async () => {
    if (!prompt) return;
    setIsMagicLoading(true);
    try {
      const enhanced = await enhancePrompt(prompt, apiKey);
      setPrompt(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMagicLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !uploadedImage && !referenceImage) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    const settings: GenerationSettings = {
      prompt,
      imageSize,
      aspectRatio,
      cameraAngles,
      rotationMode,
      timeOfDay,
      season,
      style
    };

    try {
      const result = await generateImage(settings, uploadedImage, maskImage, referenceImage, apiKey);
      setGeneratedImage(result);
    } catch (error) {
      alert(`Generation failed: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `banana-pro-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* --- Sidebar Controls --- */}
      <aside className="w-full md:w-[400px] h-auto md:h-screen overflow-y-auto bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-8 shrink-0 scrollbar-hide">
        
        {/* Header */}
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-banana-400 to-orange-500">
                Nano Banana Pro
              </h1>
              <p className="text-zinc-500 text-sm mt-1">High-Fidelity AI Studio</p>
           </div>
           <button 
             onClick={() => setShowKeyModal(true)}
             className={`p-2 rounded-lg transition-colors ${apiKey ? 'text-banana-500 bg-banana-500/10 hover:bg-banana-500/20' : 'text-zinc-500 bg-zinc-800 hover:text-white hover:bg-zinc-700'}`}
             title="Set API Key"
           >
             <Key size={20} />
           </button>
        </div>

        {/* Upload Section (Source) */}
        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Source Image (Edit/Inpaint)</label>
          <div 
             className={`relative h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group
               ${uploadedImage ? 'border-banana-500/50 bg-zinc-800' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}`}
             onClick={() => !uploadedImage && fileInputRef.current?.click()}
          >
             {uploadedImage ? (
                <>
                  <img src={`data:image/png;base64,${uploadedImage}`} className="w-full h-full object-contain" alt="Source" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <button 
                       onClick={(e) => { e.stopPropagation(); setIsEditorOpen(true); }}
                       className="p-2 bg-banana-500 rounded-full text-white hover:bg-banana-400"
                       title="Edit / Mask"
                     >
                       <Brush size={18} />
                     </button>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setUploadedImage(null); setMaskImage(null); }}
                       className="p-2 bg-red-500 rounded-full text-white hover:bg-red-400"
                       title="Remove"
                     >
                       <Trash2 size={18} />
                     </button>
                  </div>
                  {maskImage && (
                    <div className="absolute top-2 right-2 bg-banana-500 text-black text-xs px-2 py-1 rounded font-bold">
                      Mask Applied
                    </div>
                  )}
                </>
             ) : (
                <>
                  <Upload className="w-6 h-6 text-zinc-500 mb-2" />
                  <span className="text-sm text-zinc-400">Upload Source</span>
                </>
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
        </div>

        {/* Reference Image Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
             <ImagePlus size={12} /> Reference Image (Style/Content)
          </label>
          <div 
             className={`relative h-24 rounded-lg border border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden group
               ${referenceImage ? 'border-indigo-500/50 bg-zinc-800' : 'border-zinc-700 hover:border-indigo-400 hover:bg-zinc-800/50'}`}
             onClick={() => !referenceImage && referenceInputRef.current?.click()}
          >
             {referenceImage ? (
                <>
                  <img src={`data:image/png;base64,${referenceImage}`} className="w-full h-full object-cover opacity-80" alt="Reference" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button 
                       onClick={(e) => { e.stopPropagation(); setReferenceImage(null); }}
                       className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-400"
                       title="Remove Reference"
                     >
                       <Trash2 size={14} />
                     </button>
                  </div>
                </>
             ) : (
                <div className="flex flex-col items-center gap-1">
                  <ImagePlus className="w-5 h-5 text-zinc-600" />
                  <span className="text-xs text-zinc-500">Upload Reference</span>
                </div>
             )}
             <input type="file" ref={referenceInputRef} className="hidden" accept="image/*" onChange={handleReferenceUpload} />
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
           <div className="flex items-center justify-between">
             <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Prompt</label>
             <button 
               onClick={handleMagicPrompt}
               disabled={!prompt || isMagicLoading}
               className="text-xs flex items-center gap-1 text-banana-400 hover:text-banana-300 disabled:opacity-50 transition-colors"
               title="Enhance Prompt with AI"
             >
               {isMagicLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
               Magic Prompt
             </button>
           </div>
           <div className="relative">
             <textarea 
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder="Describe your image..."
               className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-banana-500 outline-none resize-none placeholder-zinc-600"
             />
           </div>
        </div>

        {/* Settings Group */}
        <div className="space-y-6">
           
           {/* Camera 3D Cube */}
           <div className="space-y-2">
             <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Settings2 size={12} /> Orientation
                </label>
                
                {/* Mode Toggle */}
                <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                    <button 
                        onClick={() => setRotationMode(RotationMode.Camera)}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${rotationMode === RotationMode.Camera ? 'bg-banana-500 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Video size={10} /> Camera
                    </button>
                    <button 
                        onClick={() => setRotationMode(RotationMode.Object)}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${rotationMode === RotationMode.Object ? 'bg-emerald-500 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Box size={10} /> Object
                    </button>
                </div>
             </div>
             
             <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <Cube3D selectedAngles={cameraAngles} onAngleToggle={handleAngleToggle} mode={rotationMode} />
             </div>
           </div>

           {/* Quick Selectors: Time & Season */}
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Time</label>
                 <select 
                   value={timeOfDay || ''} 
                   onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay || null)}
                   className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-xs text-zinc-300 outline-none focus:border-banana-500"
                 >
                   <option value="">Default</option>
                   {Object.values(TimeOfDay).map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Season</label>
                 <select 
                   value={season || ''} 
                   onChange={(e) => setSeason(e.target.value as Season || null)}
                   className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-xs text-zinc-300 outline-none focus:border-banana-500"
                 >
                   <option value="">Default</option>
                   {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
           </div>

           {/* Style Pills */}
           <div className="space-y-2">
             <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
               <Palette size={12} /> Style
             </label>
             <div className="flex flex-wrap gap-2">
               {Object.values(ArtStyle).map((s) => (
                 <button
                   key={s}
                   onClick={() => setStyle(style === s ? null : s)}
                   className={`text-xs px-3 py-1 rounded-full border transition-all ${style === s ? 'bg-banana-500 text-white border-banana-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                 >
                   {s}
                 </button>
               ))}
             </div>
           </div>
           
           {/* Tech Specs */}
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Quality</label>
                 <select 
                   value={imageSize} 
                   onChange={(e) => setImageSize(e.target.value as ImageSize)}
                   className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-xs text-zinc-300"
                 >
                   {Object.values(ImageSize).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Ratio</label>
                 <select 
                   value={aspectRatio} 
                   onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                   className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-xs text-zinc-300"
                 >
                   {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
              </div>
           </div>
        </div>

        {/* Generate Button Group */}
        <div className="space-y-2">
           <button
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt && !uploadedImage && !referenceImage)}
            className="w-full py-4 bg-gradient-to-r from-banana-500 to-orange-600 rounded-xl font-bold text-white shadow-lg shadow-orange-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
            {isGenerating ? 'Dreaming...' : 'Generate Image'}
          </button>
        </div>

      </aside>

      {/* --- Main Viewport --- */}
      <main className="flex-1 bg-zinc-950 p-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }} 
        />

        {/* Result Area */}
        <div className="relative z-10 w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center">
           {generatedImage ? (
             <div className="relative group rounded-xl overflow-hidden shadow-2xl ring-1 ring-zinc-800">
               <img src={generatedImage} alt="Generated result" className="max-w-full max-h-[85vh] object-contain" />
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                  <button 
                    onClick={handleDownload}
                    className="px-6 py-2 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                  >
                    <Download size={18} /> Download
                  </button>
               </div>
             </div>
           ) : (
             <div className="text-center space-y-4 opacity-30">
                <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mx-auto border border-zinc-800">
                  <ImageIcon size={40} className="text-zinc-500" />
                </div>
                <p className="text-xl font-medium text-zinc-500">Ready to Create</p>
                <p className="text-sm text-zinc-600 max-w-md mx-auto">
                  Select your settings on the left, use the 3D cube for angles, and upload an image to edit specific areas.
                </p>
             </div>
           )}
        </div>
      </main>

      {/* --- API Key Modal --- */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Key className="text-banana-500" /> API Key Configuration
                 </h2>
                 <button onClick={() => setShowKeyModal(false)} className="text-zinc-500 hover:text-white">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="space-y-4">
                 <p className="text-sm text-zinc-400">
                    Enter your own Google Gemini API Key to use a paid plan, increase limits, or bypass quota restrictions.
                 </p>
                 <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-zinc-500">Your API Key</label>
                    <input 
                       type="password" 
                       value={apiKey}
                       onChange={(e) => setApiKey(e.target.value)}
                       placeholder="AIza..."
                       className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-banana-500 outline-none"
                    />
                 </div>
                 <div className="flex justify-end gap-3 mt-4">
                    <button 
                       onClick={() => setShowKeyModal(false)}
                       className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={saveApiKey}
                       className="px-4 py-2 rounded-lg bg-banana-500 text-zinc-900 font-bold hover:bg-banana-400"
                    >
                       Save Key
                    </button>
                 </div>
                 <div className="text-xs text-zinc-600 pt-2 border-t border-zinc-800">
                    This key is stored locally in your browser.
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- Image Editor Modal --- */}
      {isEditorOpen && uploadedImage && (
        <ImageEditor 
          imageBase64={uploadedImage}
          onSave={(mask) => {
            setMaskImage(mask);
            setIsEditorOpen(false);
          }}
          onClose={() => setIsEditorOpen(false)}
        />
      )}

    </div>
  );
};

export default App;