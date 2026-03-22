import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button'; // We'll create this later or use raw tailwind
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors",
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
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-blue-100 rounded-full">
          <Camera className="w-8 h-8 text-blue-600" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Tap to Scan Receipt</h3>
          <p className="text-sm text-gray-500">or drag and drop image here</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-lg active:scale-95 transition-transform"
        >
          Open Camera
        </button>
      </div>
    </div>
  );
}
