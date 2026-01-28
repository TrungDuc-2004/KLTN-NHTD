import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listFiles } from "../services/documentService.js";
import "./DocumentsPage.css";

const CLASS_TABS = ["10", "11", "12"];
const TYPE_OPTIONS = [
  { value: "subject", label: "subject (môn)" },
  { value: "topic", label: "topic (chủ đề)" },
  { value: "lesson", label: "lesson (bài)" },
  { value: "chunk", label: "chunk" },
  { value: "keyword", label: "keyword" },
];

function formatBytes(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return "—";
  if (x < 1024) return `${x} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = x / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v < 10 ? 2 : 1)} ${units[i]}`;
}

export default function DocumentsPage() {
  const { role, fullName, logout } = useAuth();
  const nav = useNavigate();

  const [classId, setClassId] = useState("10");
  const [typeName, setTypeName] = useState("subject");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState({ bucket: "", prefix: "", count: 0, items: [] });

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const refresh = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await listFiles({ classId, typeName, recursive: true, limit: 500 });
      setData(res || { bucket: "", prefix: "", count: 0, items: [] });
    } catch (e) {
      setErr(e?.message || "Lỗi khi lấy danh sách tài liệu.");
      setData({ bucket: "", prefix: "", count: 0, items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, typeName]);

  const filtered = useMemo(() => {
    const items = Array.isArray(data?.items) ? data.items : [];
    const key = q.trim().toLowerCase();
    if (!key) return items;
    return items.filter((it) => {
      const a = (it?.filename || "").toLowerCase();
      const b = (it?.object_name || "").toLowerCase();
      return a.includes(key) || b.includes(key);
    });
  }, [data, q]);

  return (
    <div className="dp-root">
      <header className="dp-topbar">
        <div>
          <div className="dp-title">Danh sách tài liệu</div>
          <div className="dp-sub">
            Bucket: <b>{data?.bucket || "—"}</b> • Prefix: <b>{data?.prefix || "—"}</b>
          </div>
        </div>

        <div className="dp-user">
          <span className="dp-badge">{role || "—"}</span>
          <span className="dp-name">{fullName || "—"}</span>
          <button className="dp-btnSecondary" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="dp-card">
        <div className="dp-row">
          <div className="dp-tabs">
            {CLASS_TABS.map((c) => (
              <button
                key={c}
                className={`dp-tab ${classId === c ? "active" : ""}`}
                onClick={() => setClassId(c)}
              >
                Lớp {c}
              </button>
            ))}
          </div>

          <div className="dp-controls">
            <label className="dp-field">
              <span>Danh mục</span>
              <select value={typeName} onChange={(e) => setTypeName(e.target.value)}>
                {TYPE_OPTIONS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.value}
                  </option>
                ))}
              </select>
            </label>

            <label className="dp-field">
              <span>Tìm</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nhập tên file hoặc object_name..."
              />
            </label>

            <button className="dp-btn" onClick={refresh} disabled={loading}>
              {loading ? "Đang tải..." : "Tải lại"}
            </button>
          </div>
        </div>

        {err ? <div className="dp-msg dp-msg--err">❌ {err}</div> : null}

        <div className="dp-meta">
          Hiển thị: <b>{filtered.length}</b> / {data?.count ?? 0}
        </div>

        <div className="dp-tableWrap">
          <table className="dp-table">
            <thead>
              <tr>
                <th>Tên file</th>
                <th>Object</th>
                <th>Size</th>
                <th>Last modified</th>
                <th>Mở</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="dp-empty">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="dp-empty">
                    Danh sách rỗng.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={it.object_name}>
                    <td className="dp-file">{it.filename || "—"}</td>
                    <td className="dp-mono">{it.object_name}</td>
                    <td>{formatBytes(it.size_bytes)}</td>
                    <td className="dp-mono">{it.last_modified || "—"}</td>
                    <td>
                      {it.public_url ? (
                        <a className="dp-link" href={it.public_url} target="_blank" rel="noreferrer">
                          Mở
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
