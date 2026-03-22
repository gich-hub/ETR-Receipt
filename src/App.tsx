import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Scan } from '@/pages/Scan';
import { Review } from '@/pages/Review';
import { Export } from '@/pages/Export';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/review" element={<Review />} />
        <Route path="/receipt/:id" element={<Review />} />
        <Route path="/export" element={<Export />} />
      </Routes>
    </BrowserRouter>
  );
}
