import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Brush, Undo, Check, X } from 'lucide-react';

interface ImageEditorProps {
  imageBase64: string;
  onSave: (maskBase64: string) => void;
  onClose: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageBase64, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(50); // Increased default brush size for high res
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  
  // Store scale factors to map screen coordinates to actual image pixels
  const scaleRef = useRef({ x: 1, y: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = `data:image/png;base64,${imageBase64}`;
    img.onload = () => {
      // CRITICAL FIX: Set canvas size to the IMAGE'S NATURAL DIMENSIONS
      // This ensures the mask aligns 1:1 with the source image sent to API
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Calculate scale implies knowing the displayed size.
      // We handle this dynamically in getCoordinates
    };
  }, [imageBase64]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    // Calculate position relative to the displayed element
    const xRelative = clientX - rect.left;
    const yRelative = clientY - rect.top;

    // SCALING FIX: Map displayed pixels to actual canvas pixels
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: xRelative * scaleX,
      y: yRelative * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      draw(e);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = mode === 'draw' ? 'rgba(255, 255, 255, 1.0)' : 'rgba(0, 0, 0, 1.0)'; // Use full opacity
      ctx.globalCompositeOperation = mode === 'draw' ? 'source-over' : 'destination-out';
      
      // Scale brush size relative to image resolution (heuristic)
      // If image is 4K, a size 30 brush is tiny. 
      // We use the slider value directly, but users might need larger brushes for 4K.
      ctx.lineWidth = brushSize;
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.closePath();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a new canvas to export ONLY the mask on a black background
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Fill background with BLACK (Keep original)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 2. Draw the WHITE strokes (Edit area)
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    onSave(base64);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 overflow-hidden">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        
        {/* Toolbar */}
        <div className="bg-zinc-900/90 rounded-full px-6 py-3 mb-4 flex items-center gap-6 shadow-2xl border border-zinc-800 z-50">
          <div className="flex gap-2">
             <button 
                onClick={() => setMode('draw')}
                className={`p-2 rounded-full transition-colors ${mode === 'draw' ? 'bg-banana-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                title="Brush (Mask Area)"
             >
                <Brush size={20} />
             </button>
             <button 
                onClick={() => setMode('erase')}
                className={`p-2 rounded-full transition-colors ${mode === 'erase' ? 'bg-banana-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                title="Eraser"
             >
                <Eraser size={20} />
             </button>
          </div>

          <div className="h-6 w-px bg-zinc-700 mx-2"></div>

          <div className="flex items-center gap-2">
             <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">Size {brushSize}px</span>
             <input 
               type="range" 
               min="10" 
               max="300" 
               value={brushSize} 
               onChange={(e) => setBrushSize(Number(e.target.value))}
               className="w-32 accent-banana-500 cursor-pointer"
             />
          </div>

          <div className="h-6 w-px bg-zinc-700 mx-2"></div>

          <button onClick={clearCanvas} className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700" title="Clear Mask">
             <Undo size={20} />
          </button>
        </div>

        {/* Editor Area */}
        <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden p-4">
           {/* Container limits visuals but canvas remains full resolution */}
           <div className="relative shadow-2xl border border-zinc-800 bg-zinc-950/50 max-w-full max-h-full aspect-auto inline-block">
               {/* Background Image Reference */}
               <img 
                 src={`data:image/png;base64,${imageBase64}`} 
                 alt="Reference"
                 className="max-w-full max-h-[80vh] object-contain opacity-60 pointer-events-none select-none block"
                 style={{ touchAction: 'none' }}
               />
               
               {/* Painting Layer - Positioned absolutely over the image */}
               <canvas
                 ref={canvasRef}
                 className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                 onMouseDown={startDrawing}
                 onMouseMove={draw}
                 onMouseUp={stopDrawing}
                 onMouseLeave={stopDrawing}
                 onTouchStart={startDrawing}
                 onTouchMove={draw}
                 onTouchEnd={stopDrawing}
               />
           </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-4 z-50 pb-4">
            <button 
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center gap-2 transition-transform active:scale-95"
            >
                <X size={18} /> Cancel
            </button>
            <button 
                onClick={handleSave}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-banana-500 to-orange-600 hover:from-banana-400 hover:to-orange-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-orange-900/20 transition-transform active:scale-95"
            >
                <Check size={20} /> Apply Mask
            </button>
        </div>
        
        <div className="absolute bottom-4 left-4 text-zinc-500 text-xs bg-black/50 px-2 py-1 rounded">
           Painting white areas to edit. Black areas remain unchanged.
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;