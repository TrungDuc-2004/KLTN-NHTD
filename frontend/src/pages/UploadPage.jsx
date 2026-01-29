import React, { useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./UploadPage.css";

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_BASE = RAW_API_BASE.endsWith("/") ? RAW_API_BASE.slice(0, -1) : RAW_API_BASE;
const UPLOAD_ENDPOINT = "/admin/minio/file";

export default function UploadPage() {
  const { token, role, fullName, logout } = useAuth();
  const nav = useNavigate();

  // User nhập
  const [classValue, setClassValue] = useState("10");
  const [typeValue, setTypeValue] = useState("subject");
  const [metadataText, setMetadataText] = useState("{}");

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const fileInputRef = useRef(null);

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const validateAndNormalizeMetadata = (text) => {
    const raw = (text ?? "").trim();
    if (!raw) return {}; // cho phép rỗng => {}
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      throw new Error(`metadata không hợp lệ (JSON parse fail): ${e?.message || e}`);
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      throw new Error('metadata phải là JSON object. Ví dụ: {"lesson_id":"..."}');
    }
    return obj;
  };

  const pickUrlFromResponse = (data, currentType) => {
    const doc = data?.mongo?.document;
    if (!doc) return null;
    if (doc.url) return doc.url;
    const key = `${currentType}_url`;
    return doc[key] || doc?.file?.public_url || null;
  };

  const handleUpload = async () => {
    setMsg("");

    if (!token) {
      setMsg("❌ Bạn chưa đăng nhập hoặc token không tồn tại. Vui lòng đăng nhập lại.");
      nav("/login");
      return;
    }

    const fileEl = fileInputRef.current;
    const file = fileEl?.files?.[0];

    if (!file) {
      setMsg("Bạn chưa chọn tệp.");
      return;
    }
    if (file.size <= 0) {
      setMsg("Tệp rỗng hoặc không hợp lệ.");
      return;
    }

    const cls = (classValue || "").trim();
    if (!["10", "11", "12"].includes(cls)) {
      setMsg("class phải là 10/11/12.");
      return;
    }

    const tp = (typeValue || "").trim();
    if (!["subject", "topic", "lesson", "chunk"].includes(tp)) {
      setMsg("type phải là subject/topic/lesson/chunk.");
      return;
    }

    let metaObj = {};
    try {
      metaObj = validateAndNormalizeMetadata(metadataText);
    } catch (e) {
      setMsg(`❌ ${e.message || e}`);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("class", cls);
      formData.append("type", tp);
      // gửi metadata chuẩn (object -> string)
      formData.append("metadata", JSON.stringify(metaObj));
      formData.append("file", file);

      const url = `${API_BASE}${UPLOAD_ENDPOINT}`;

      const res = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // axios tự set boundary cho multipart, set tay vẫn OK nhưng không bắt buộc
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setProgress(Math.max(0, Math.min(100, pct)));
        },
        timeout: 60_000, // tránh treo vô hạn
      });

      setProgress(100);

      const uploadedUrl = pickUrlFromResponse(res.data, tp);
      setMsg(uploadedUrl ? `✅ Tải lên thành công. URL: ${uploadedUrl}` : "✅ Tải lên thành công.");

      // reset input file
      if (fileEl) fileEl.value = "";
      setTimeout(() => setProgress(0), 400);
    } catch (err) {
      // axios error shape
      const status = err?.response?.status;

      if (status === 401) {
        // token invalid/expired
        logout();
        nav("/login");
        return;
      }

      const detail = err?.response?.data?.detail;
      const message = detail || err?.message || "Unknown error";
      setMsg(`❌ Tải lên thất bại: ${message}`);
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
          <div className="up-sub">
            Nhập <b>class</b>, <b>type</b>, <b>metadata</b>. URL sẽ tự được BE gắn vào Mongo.
          </div>
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
            <span>Class</span>
            <select value={classValue} onChange={(e) => setClassValue(e.target.value)}>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
          </label>

          <label className="up-field">
            <span>Type</span>
            <select value={typeValue} onChange={(e) => setTypeValue(e.target.value)}>
              <option value="subject">subject</option>
              <option value="topic">topic</option>
              <option value="lesson">lesson</option>
              <option value="chunk">chunk</option>
            </select>
          </label>
        </div>

        <label className="up-field">
          <span>Metadata (JSON)</span>
          <textarea
            className="up-textarea"
            rows={6}
            value={metadataText}
            onChange={(e) => setMetadataText(e.target.value)}
            placeholder='{"lesson_id":"TH10_T1_L1","lesson_name":"Bài 1"}'
          />
          <div className="up-help">
            Không cần nhập <b>url</b>. BE sẽ tự thêm <b>url</b> (và {typeValue}_url) vào Mongo.
          </div>
        </label>

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
            <div className="up-progressFill" style={{ width: `${progress}%` }} />
          </div>
          <div className="up-progressText">{progress}%</div>
        </div>
      </div>
    </div>
  );
}
