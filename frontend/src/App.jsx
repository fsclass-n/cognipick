import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Main from './pages/Main'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Demand from './pages/Demand'
import Diagnosis from './pages/Diagnosis'
import Pick from './pages/Pick'
import Tutor from './pages/Tutor'
import MyPage from './pages/MyPage'
import Login from './pages/Login'
import Register from './pages/Register'
import OAuthCallback from './pages/OAuthCallback'
import Info from './pages/Info'
import NotFound from './pages/NotFound'
import Admin from './pages/admin/Admin'

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
      </Route>
      <Route element={<MainLayout />}>
        <Route index element={<Main />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="demand" element={<Demand />} />
        <Route path="tutor" element={<Tutor />} />
        <Route path="info/:slug" element={<Info />} />
        <Route element={<ProtectedRoute />}>
          <Route path="diagnosis" element={<Diagnosis />} />
          <Route path="pick" element={<Pick />} />
          <Route path="mypage" element={<MyPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin', 'admin_readonly']} />}>
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}
