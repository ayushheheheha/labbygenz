import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/shared/ProtectedRoute'
import AdminRoute from './components/shared/AdminRoute'
import StudentLayout from './components/layout/StudentLayout'
import AdminLayout from './components/layout/AdminLayout'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyOtp from './pages/auth/VerifyOtp'
import OAuthCallback from './pages/auth/OAuthCallback'

import Home from './pages/student/Home'
import CourseDetail from './pages/student/CourseDetail'
import QuizAttempt from './pages/student/QuizAttempt'
import QuizResult from './pages/student/QuizResult'
import IDEPractice from './pages/student/IDEPractice'
import IDEProblemList from './pages/student/IDEProblemList'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCourses from './pages/admin/AdminCourses'
import AdminQuizList from './pages/admin/AdminQuizList'
import AdminQuizManage from './pages/admin/AdminQuizManage'
import AdminIDEProblems from './pages/admin/AdminIDEProblems'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#161c27',
              color: '#e2e8f0',
              border: '1px solid #1e2a3a',
            },
          }}
        />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/ide/:problemId" element={<IDEPractice />} />
            <Route element={<StudentLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/courses/:slug" element={<CourseDetail />} />
              <Route path="/courses/:slug/ide-problems" element={<IDEProblemList />} />
              <Route path="/quiz/:id" element={<QuizAttempt />} />
              <Route path="/quiz/:id/result/:attemptId" element={<QuizResult />} />
            </Route>
          </Route>

          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/quizzes" element={<AdminQuizList />} />
              <Route path="/admin/quizzes/:id" element={<AdminQuizManage />} />
              <Route path="/admin/ide-problems" element={<AdminIDEProblems />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
