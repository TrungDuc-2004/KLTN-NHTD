import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listDocuments } from "../services/documentService.js";
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

function formatDateOnly(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function DocumentsPage() {
  const { role, fullName, logout } = useAuth();
  const nav = useNavigate();

  const [classId, setClassId] = useState("10");
  const [typeName, setTypeName] = useState("subject");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState({ count: 0, items: [] });

  // menu ⋯
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const refresh = async () => {
    setErr("");
    setLoading(true);
    try {
      // q: có thể gửi lên BE để filter
      const res = await listDocuments({ classId, typeName, q: q.trim(), limit: 500 });
      setData(res || { count: 0, items: [] });
    } catch (e) {
      setErr(e?.message || "Lỗi khi lấy danh sách tài liệu.");
      setData({ count: 0, items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, typeName]);

  const items = useMemo(() => (Array.isArray(data?.items) ? data.items : []), [data]);

  // nếu muốn FE filter thêm (không bắt buộc)
  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return items;
    return items.filter((it) => {
      const a = (it?.name || "").toLowerCase();
      const b = (it?.url || "").toLowerCase();
      return a.includes(key) || b.includes(key);
    });
  }, [items, q]);

  return (
    <div className="dp-root">
      <header className="dp-topbar">
        <div>
          <div className="dp-title">Danh sách tài liệu</div>
          <div className="dp-sub">
            Nguồn: <b>MongoDB</b> • Class: <b>{classId}</b> • Type: <b>{typeName}</b>
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
                placeholder="Nhập tên (name trong Mongo) hoặc URL..."
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
          <table className="dp-table dp-table--mongo">
            <thead>
              <tr>
                <th>Tên file</th>
                <th>Type file</th>
                <th>Size</th>
                <th>Lần cập nhật cuối</th>
                <th className="dp-thActions"></th>
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
                  <tr
                    key={it.id}
                    className="dp-rowClickable"
                    onClick={() => nav(`/documents/${it.id}?type=${encodeURIComponent(typeName)}`)}
                    title="Bấm để xem chi tiết"
                  >
                    {/* Tên file = name trong Mongo (vd subject_name = Tin) */}
                    <td className="dp-file">{it.name || "—"}</td>

                    {/* Type file = đuôi URL */}
                    <td className="dp-mono">{(it.file_type || "unknown").toUpperCase()}</td>

                    <td>{formatBytes(it.size_bytes)}</td>

                    {/* Lần cập nhật cuối = dd/mm/yyyy */}
                    <td className="dp-mono">{formatDateOnly(it.last_updated)}</td>

                    {/* ⋯ menu */}
                    <td
                      className="dp-actions"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div
                        className="dp-menuWrap"
                        ref={openMenuId === it.id ? menuRef : null}
                      >
                        <button
                          className="dp-menuBtn"
                          onClick={() => setOpenMenuId(openMenuId === it.id ? null : it.id)}
                          aria-label="menu"
                        >
                          ⋯
                        </button>

                        {openMenuId === it.id ? (
                          <div className="dp-menu">
                            <button
                              className="dp-menuItem"
                              onClick={() => {
                                setOpenMenuId(null);
                                if (it.url) window.open(it.url, "_blank", "noopener,noreferrer");
                              }}
                            >
                              Mở file
                            </button>
                            <button
                              className="dp-menuItem dp-menuItem--danger"
                              onClick={() => {
                                setOpenMenuId(null);
                                alert("Chức năng xóa file: CHƯA LÀM");
                              }}
                            >
                              Xóa file
                            </button>
                          </div>
                        ) : null}
                      </div>
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
