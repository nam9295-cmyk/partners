import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SupportersPage from './SupportersPage';
import AdminPage from './AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SupportersPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
