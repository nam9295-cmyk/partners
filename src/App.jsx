import { BrowserRouter, Routes, Route } from 'react-router-dom';
import KidsClassPage from './KidsClassPage';
import AdminPage from './AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KidsClassPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
