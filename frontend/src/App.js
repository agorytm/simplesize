import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TutorialPage from './pages/TutorialPage';
import AboutPage from './pages/AboutPage';
import CommunityPage from './pages/CommunityPage';
import CommunityPostPage from './pages/CommunityPostPage';
import AdminPage from './pages/AdminPage';
import DonatePage from './pages/DonatePage';
import LexiquePage from './pages/LexiquePage';
import GalleryPage from './pages/GalleryPage';
import ChangelogPage from './pages/ChangelogPage';
import MethodsPage  from './pages/MethodsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ paddingTop: 56 }}>
        <Routes>
          <Route path="/"            element={<HomePage />} />
          <Route path="/tutorial"    element={<TutorialPage />} />
          <Route path="/about"       element={<AboutPage />} />
          <Route path="/community"   element={<CommunityPage />} />
          <Route path="/community/:id" element={<CommunityPostPage />} />
          <Route path="/donate"      element={<DonatePage />} />
          <Route path="/lexique"     element={<LexiquePage />} />
          <Route path="/gallery"     element={<GalleryPage />} />
          <Route path="/changelog"   element={<ChangelogPage />} />
          <Route path="/methods"     element={<MethodsPage />} />
          <Route path="/adm"         element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
