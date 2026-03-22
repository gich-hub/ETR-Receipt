import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button'; // We'll create this later or use raw tailwind
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onCapture(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onCapture(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-6 md:p-8 border-2 border-dashed rounded-xl transition-colors",
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleFileChange}
      />
      
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={galleryInputRef}
        onChange={handleFileChange}
      />
      
      <div className="flex flex-col items-center gap-3 md:gap-4 w-full">
        <div className="p-3 md:p-4 bg-blue-100 rounded-full">
          <Camera className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
        </div>
        <div className="text-center mb-2">
          <h3 className="text-base md:text-lg font-semibold">Scan or Upload Receipt</h3>
          <p className="text-xs md:text-sm text-gray-500">Take a photo or choose from gallery</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-blue-600 text-white font-medium rounded-lg shadow-lg active:scale-95 transition-transform text-sm md:text-base"
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          
          <button 
            onClick={() => galleryInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 md:px-5 md:py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 active:scale-95 transition-transform text-sm md:text-base"
          >
            <ImageIcon className="w-4 h-4" />
            Gallery
          </button>
        </div>
      </div>
    </div>
  );
}
