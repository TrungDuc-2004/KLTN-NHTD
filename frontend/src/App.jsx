import React, { useMemo, useRef, useState } from "react";
import axios from "axios";

/**
 * Front-end (React) gọi API upload duy nhất:
 *  - QLTL-UP-01: POST /admin/minio/file (UI -> FastAPI)
 * Backend sẽ thực hiện:
 *  - QLTL-UP-02: minio_client.put_object(...) (FastAPI -> MinIO)
 */
const API_BASE_URL = "http://127.0.0.1:8000";
const UPLOAD_ENDPOINT = "/admin/minio/file";

function Toast({ type, message }) {
  return (
    <div className={`toast ${type}`}>
      <div style={{ fontSize: 16 }}>{type === "success" ? "✅" : "❌"}</div>
      <div>{message}</div>
    </div>
  );
}

export default function App() {
  const [classId, setClassId] = useState("10");
  const [typeName, setTypeName] = useState("subject");
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [toast, setToast] = useState(null); // {type, message}
  const toastTimer = useRef(null);

  const fileInputRef = useRef(null);

  const progressWidth = useMemo(
    () => `${Math.max(0, Math.min(100, progress))}%`,
    [progress]
  );

  const showToast = (type, message) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const reset = () => {
    setProgress(0);
    setIsUploading(false);
  };

  const handleUpload = async () => {
    const fileEl = fileInputRef.current;

    // 1) Check file có được chọn không
    if (!fileEl?.files || fileEl.files.length === 0) {
      showToast("error", "Tải lên thất bại: Bạn chưa chọn tệp.");
      return;
    }

    const file = fileEl.files[0];

    // 2) Check file rỗng
    if (!file || file.size === 0) {
      showToast("error", "Tải lên thất bại: Tệp rỗng hoặc không hợp lệ.");
      return;
    }

    // 3) Check class_id rỗng
    if (!classId.trim()) {
      showToast("error", "Tải lên thất bại: class_id không được để trống.");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("class_id", classId.trim());
      formData.append("type_name", typeName);
      formData.append("file", file);

      await axios.post(`${API_BASE_URL}${UPLOAD_ENDPOINT}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setProgress(percent);
        }
      });

      setProgress(100);
      showToast("success", "Tải lên thành công.");

      // reset input
      fileEl.value = "";
      setTimeout(() => setProgress(0), 500);
    } catch (err) {
      let msg = "Tải lên thất bại.";
      if (err?.response?.data?.detail) msg = `Tải lên thất bại: ${err.response.data.detail}`;
      else if (err?.response?.data?.message) msg = `Tải lên thất bại: ${err.response.data.message}`;
      else if (err?.message) msg = `Tải lên thất bại: ${err.message}`;

      showToast("error", msg);
      reset();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="container">
        <h1>Upload tài liệu</h1>
        <p className="sub">
          3-layer: Front-end (React) → Back-end (FastAPI) → Database (MinIO)
        </p>

        <div className="form">
          <div className="grid2">
            <label>
              Class ID
              <input
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="VD: 10"
              />
              <span className="hint">Bucket: <b>class-{classId || "..."}</b></span>
            </label>

            <label>
              Type Name
              <select value={typeName} onChange={(e) => setTypeName(e.target.value)}>
                <option value="subject">subject</option>
                <option value="topic">topic</option>
                <option value="lesson">lesson</option>
                <option value="chunk">chunk</option>
                <option value="keyword">keyword</option>
              </select>
            </label>
          </div>

          <label>
            Chọn tệp
            <input ref={fileInputRef} type="file" />
            <span className="hint">Nếu tệp rỗng / chưa chọn tệp → sẽ báo thất bại.</span>
          </label>

          <button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Đang tải lên..." : "Tải lên"}
          </button>

          <div className="progressWrap">
            <div className="progressBar">
              <div className="progressFill" style={{ width: progressWidth }} />
            </div>
            <div className="progressText">{progress}%</div>
          </div>
        </div>

        <p className="hint" style={{ marginTop: 14 }}>
          API sử dụng: <b>POST {UPLOAD_ENDPOINT}</b> (không hiển thị URL trên UI)
        </p>
      </div>

      <div className="toastContainer">
        {toast ? <Toast type={toast.type} message={toast.message} /> : null}
      </div>
    </>
  );
}
