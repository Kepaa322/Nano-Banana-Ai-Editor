import React, { useState, useRef, useEffect } from 'react';
import { CameraAngle, RotationMode } from '../types';

interface Cube3DProps {
  selectedAngles: CameraAngle[];
  onAngleToggle: (angle: CameraAngle) => void;
  mode: RotationMode;
}

const Cube3D: React.FC<Cube3DProps> = ({ selectedAngles, onAngleToggle, mode }) => {
  const [rotation, setRotation] = useState({ x: -15, y: 45 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    
    setRotation(prev => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const Face = ({ type, transform, label }: { type: CameraAngle, transform: string, label: string }) => {
    const isSelected = selectedAngles.includes(type);
    
    // Dynamic styles based on mode
    const activeColor = mode === RotationMode.Camera ? 'bg-banana-500/90 border-banana-300' : 'bg-emerald-500/90 border-emerald-300';
    const activeGlow = mode === RotationMode.Camera ? 'shadow-[0_0_25px_rgba(234,179,8,0.8)]' : 'shadow-[0_0_25px_rgba(16,185,129,0.8)]';
    const activeBorder = mode === RotationMode.Camera ? 'border-banana-400/30 hover:border-banana-400/60' : 'border-emerald-400/30 hover:border-emerald-400/60';

    return (
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onAngleToggle(type);
        }}
        className={`absolute w-32 h-32 border-2 flex items-center justify-center text-center p-2 cursor-pointer transition-all duration-300 backface-visible select-none
          ${isSelected 
            ? `${activeColor} text-white border-white ${activeGlow} z-10` 
            : `bg-zinc-800/90 text-zinc-300 ${activeBorder} hover:bg-zinc-700/90`}
        `}
        style={{ 
          transform,
          backfaceVisibility: 'visible' 
        }}
      >
        <span className="text-xs font-bold uppercase tracking-wider pointer-events-none">{label}</span>
        {isSelected && (
            <div className="absolute inset-0 border-4 opacity-50 pointer-events-none animate-pulse" style={{ borderColor: 'inherit' }}></div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="w-full h-48 flex items-center justify-center perspective-800 cursor-move"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <div 
          className="relative w-32 h-32 preserve-3d transition-transform duration-100 ease-linear"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` 
          }}
        >
          {/* Front */}
          <Face type={CameraAngle.Front} transform="translateZ(64px)" label="Front" />
          {/* Back */}
          <Face type={CameraAngle.Back} transform="rotateY(180deg) translateZ(64px)" label="Back" />
          {/* Right */}
          <Face type={CameraAngle.Right} transform="rotateY(90deg) translateZ(64px)" label="Right" />
          {/* Left */}
          <Face type={CameraAngle.Left} transform="rotateY(-90deg) translateZ(64px)" label="Left" />
          {/* Top */}
          <Face type={CameraAngle.Top} transform="rotateX(90deg) translateZ(64px)" label="Top" />
          {/* Bottom */}
          <Face type={CameraAngle.Bottom} transform="rotateX(-90deg) translateZ(64px)" label="Bottom" />
        </div>
      </div>
      
      <div className="text-xs text-zinc-500 text-center px-4">
        {mode === RotationMode.Camera 
          ? "Select faces to position the CAMERA angle (e.g., Top-Down View)."
          : "Select faces to rotate the SUBJECT/OBJECT (e.g., Object facing Left)."
        }
      </div>
      
      {/* Quick Select Buttons */}
      <div className="grid grid-cols-2 gap-2 w-full mt-2">
         <button 
           onClick={() => onAngleToggle(CameraAngle.Dutch)}
           className={`text-xs px-2 py-1 rounded border transition-colors ${selectedAngles.includes(CameraAngle.Dutch) ? 'bg-banana-500 text-white border-banana-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
         >
           Dutch Angle
         </button>
         <button 
           onClick={() => onAngleToggle(CameraAngle.Isometric)}
           className={`text-xs px-2 py-1 rounded border transition-colors ${selectedAngles.includes(CameraAngle.Isometric) ? 'bg-banana-500 text-white border-banana-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
         >
           Isometric
         </button>
      </div>
      
      {selectedAngles.length > 0 && (
          <div className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${mode === RotationMode.Camera ? 'text-banana-400' : 'text-emerald-400'}`}>
              Active: {selectedAngles.length}
          </div>
      )}
    </div>
  );
};

export default Cube3D;