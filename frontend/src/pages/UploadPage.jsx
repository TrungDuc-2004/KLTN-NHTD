import React, { useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./UploadPage.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const UPLOAD_ENDPOINT = "/admin/minio/file";

export default function UploadPage() {
  const { token, role, fullName, logout } = useAuth();
  const nav = useNavigate();

  const [classId, setClassId] = useState("10");
  const [typeName, setTypeName] = useState("subject");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const fileInputRef = useRef(null);

  const progressWidth = useMemo(
    () => `${Math.max(0, Math.min(100, progress))}%`,
    [progress]
  );

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const handleUpload = async () => {
    setMsg("");

    const fileEl = fileInputRef.current;
    if (!fileEl?.files || fileEl.files.length === 0) {
      setMsg("Bạn chưa chọn tệp.");
      return;
    }

    const file = fileEl.files[0];
    if (!file || file.size === 0) {
      setMsg("Tệp rỗng hoặc không hợp lệ.");
      return;
    }

    if (!classId.trim()) {
      setMsg("class_id không được để trống.");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("class_id", classId.trim());
      formData.append("type_name", typeName);
      formData.append("file", file);

      await axios.post(`${API_BASE}${UPLOAD_ENDPOINT}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });

      setProgress(100);
      setMsg("✅ Tải lên thành công.");
      fileEl.value = "";
      setTimeout(() => setProgress(0), 500);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setMsg(`❌ Tải lên thất bại: ${detail || err?.message || "Unknown error"}`);
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="up-root">
      <header className="up-topbar">
        <div>
          <div className="up-title">Upload tài liệu</div>
          <div className="up-sub">Trang riêng cho chức năng upload (khác giao diện login)</div>
        </div>

        <div className="up-user">
          <span className="up-badge">{role}</span>
          <span className="up-name">{fullName || "—"}</span>
          <button className="up-btnSecondary" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="up-card">
        <div className="up-grid2">
          <label className="up-field">
            <span>Class ID</span>
            <input value={classId} onChange={(e) => setClassId(e.target.value)} />
          </label>

          <label className="up-field">
            <span>Type Name</span>
            <select value={typeName} onChange={(e) => setTypeName(e.target.value)}>
              <option value="subject">subject</option>
              <option value="topic">topic</option>
              <option value="lesson">lesson</option>
              <option value="chunk">chunk</option>
              <option value="keyword">keyword</option>
            </select>
          </label>
        </div>

        <label className="up-field">
          <span>Chọn tệp</span>
          <input ref={fileInputRef} type="file" />
        </label>

        <button className="up-btn" onClick={handleUpload} disabled={isUploading}>
          {isUploading ? "Đang tải lên..." : "Tải lên"}
        </button>

        {msg ? <div className="up-msg">{msg}</div> : null}

        <div className="up-progressWrap">
          <div className="up-progressBar">
            <div className="up-progressFill" style={{ width: progressWidth }} />
          </div>
          <div className="up-progressText">{progress}%</div>
        </div>
      </div>
    </div>
  );
}
