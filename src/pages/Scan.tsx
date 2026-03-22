import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CameraCapture } from '@/components/CameraCapture';
import { analyzeReceipt } from '@/lib/gemini';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function Scan() {
  const navigate = useNavigate();
  const location = useLocation();
  const persona = location.state?.persona; // Get persona from Home
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      // Analyze with Gemini
      const result = await analyzeReceipt(file);
      
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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="px-6 py-4 border-b flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Scan Receipt</h1>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center">
        {isAnalyzing ? (
          <div className="text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Analyzing Receipt...</h2>
            <p className="text-gray-500">Extracting merchant, date, and amount</p>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6">
            <CameraCapture onCapture={handleCapture} />
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            <div className="text-center text-sm text-gray-500">
              <p>Ensure good lighting and hold steady.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
