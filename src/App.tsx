import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/LoginPage';
const BoardsPage = lazy(() => import('./pages/BoardsPage').then((m) => ({ default: m.BoardsPage })));
const BoardPage = lazy(() => import('./pages/BoardPage').then((m) => ({ default: m.BoardPage })));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p role="status">Loading…</p>}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/boards"
          element={
            <RequireAuth>
              <BoardsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/boards/:boardId"
          element={
            <RequireAuth>
              <BoardPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
