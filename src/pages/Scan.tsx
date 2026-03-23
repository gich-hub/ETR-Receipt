import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CameraCapture } from '@/components/CameraCapture';
import { analyzeReceipt } from '@/lib/gemini';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function Scan() {
  const navigate = useNavigate();
  const location = useLocation();
  const persona = location.state?.persona; // Get persona from Home
  const autoProcessFile = location.state?.autoProcessFile;
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoProcessed = useRef(false);

  const handleCapture = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      // Analyze with Gemini
      const result = await analyzeReceipt(file);
      
      // Check for buyer PIN contradiction
      if (persona && result.buyerPin) {
        const scannedPin = result.buyerPin.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const personaPin = persona.kraPin.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        
        if (scannedPin && personaPin && scannedPin !== personaPin) {
          setError(`PIN Mismatch: The receipt is for buyer PIN ${result.buyerPin}, but the selected persona has PIN ${persona.kraPin}.`);
          setIsAnalyzing(false);
          return;
        }
      }
      
      // Pass data to Review page via state
      navigate('/review', { 
        state: { 
          image: file, 
          ocrData: result,
          persona: persona 
        } 
      });
    } catch (err) {
      console.error(err);
      setError("Failed to analyze receipt. Please try again.");
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (autoProcessFile && !hasAutoProcessed.current) {
      hasAutoProcessed.current = true;
      handleCapture(autoProcessFile);
    }
  }, [autoProcessFile]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="px-4 md:px-6 py-3 md:py-4 border-b flex items-center gap-3 md:gap-4 sticky top-0 bg-white z-10">
        <Link to="/">
          <Button variant="ghost" size="icon" className="w-8 h-8 md:w-10 md:h-10">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-base md:text-lg font-semibold">Scan Receipt</h1>
          {persona && (
            <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-xs">For: {persona.name}</p>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center w-full">
        {isAnalyzing ? (
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Analyzing Receipt...</h2>
            <p className="text-sm md:text-base text-gray-500">Extracting merchant, date, and amount</p>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-4 md:space-y-6">
            <CameraCapture onCapture={handleCapture} />
            {error && (
              <div className="p-3 md:p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            <div className="text-center text-xs md:text-sm text-gray-500">
              <p>Ensure good lighting and hold steady.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
