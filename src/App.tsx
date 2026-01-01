//frontend\src\App.tsx

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { SharedRecipe } from './components/SharedRecipe';
import { ProfileEditPage } from './components/ProfileEditPage';
import { ProfileDeletePage } from './components/ProfileDeletePage';
import { RecipeDetailPage } from './components/RecipeDetailPage';



function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Hlavní stránka s recepty */}
        <Route path="/" element={<HomePage />} />

        {/* Detail receptu */}
        <Route path="/:id" element={<RecipeDetailPage />} />

        {/* Sdílený recept pomocí tokenu */}
        <Route path="/shared/:token" element={<SharedRecipe />} />

        {/* Profilové stránky */}
        <Route path="/profile/edit" element={<ProfileEditPage />} />
        <Route path="/profile/delete" element={<ProfileDeletePage />} />

        {/* 404 - přesměrování na homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;