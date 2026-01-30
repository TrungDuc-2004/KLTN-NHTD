import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import DocumentDetailPage from "./pages/DocumentDetailPage.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/documents"
        element={
          <ProtectedRoute allowRoles={["admin"]}>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/:id"
        element={
         <ProtectedRoute allowRoles={["admin"]}>
          <DocumentDetailPage />
         </ProtectedRoute>
      }
      />

      <Route
        path="/upload"
        element={
          <ProtectedRoute allowRoles={["admin"]}>
            <UploadPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/documents" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
