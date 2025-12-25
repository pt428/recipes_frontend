//frontend\src\App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { SharedRecipe } from './components/Sharedrecipe';
 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Hlavní stránka s recepty */}
        <Route path="/" element={<HomePage />} />

        {/* Sdílený recept pomocí tokenu */}
        <Route path="/shared/:token" element={<SharedRecipe />} />

        {/* 404 - přesměrování na homepage */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;