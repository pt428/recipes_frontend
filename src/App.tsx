//frontend\src\App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { SharedRecipe } from './components/SharedRecipe';
import { ProfileEditPage } from './components/ProfileEditPage';
import { ProfileDeletePage } from './components/ProfileDeletePage';
 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Hlavní stránka s recepty */}
        <Route path="/" element={<HomePage />} />

        {/* Sdílený recept pomocí tokenu */}
        <Route path="/shared/:token" element={<SharedRecipe />} />

        {/* Profilové stránky */}
        <Route path="/profile/edit" element={<ProfileEditPage />} />
        <Route path="/profile/delete" element={<ProfileDeletePage />} />

        {/* 404 - přesměrování na homepage */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;