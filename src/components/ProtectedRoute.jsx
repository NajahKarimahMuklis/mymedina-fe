import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Debug: lihat nilai token dan role
  console.log('Token:', token);
  console.log('Role:', role);
  console.log('Allowed Roles:', allowedRoles);

  // Jika tidak ada token, redirect ke login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Jika ada role yang diizinkan, cek apakah user memiliki role tersebut
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect berdasarkan role
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Jika semua validasi lolos, tampilkan halaman
  return children;
}