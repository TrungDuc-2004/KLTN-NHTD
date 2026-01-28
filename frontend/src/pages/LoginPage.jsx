import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const canSubmit = useMemo(() => {
    return form.username.trim() && form.password.trim() && !loading;
  }, [form, loading]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (msg.text) setMsg({ type: "", text: "" });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const data = await login(form.username, form.password);
      setMsg({ type: "success", text: `Đăng nhập thành công (${data.role}).` });
      setTimeout(() => nav("/documents"), 450);
      setTimeout(() => nav("/upload"), 450);
    } catch (err) {
      setMsg({ type: "error", text: err?.message || "Đăng nhập thất bại." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <div className="lp-bg" aria-hidden="true" />
      <div className="lp-overlay" aria-hidden="true" />
      <div className="lp-blob lp-blob--1" aria-hidden="true" />
      <div className="lp-blob lp-blob--2" aria-hidden="true" />
      <div className="lp-blob lp-blob--3" aria-hidden="true" />

      <main className="lp-main">
        <section className="lp-card" aria-label="Đăng nhập">
          <header className="lp-header">
            <img
              className="lp-logo"
              src="/logo-hcmue.png"
              alt="Logo"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div>
              <h1 className="lp-title">ĐĂNG NHẬP</h1>
              <p className="lp-subtitle">Cổng thông tin đào tạo</p>
            </div>
          </header>

          <form className="lp-form" onSubmit={onSubmit}>
            <label className="lp-label">
              <span className="lp-labelText">Tên đăng nhập</span>
              <div className="lp-inputWrap">
                <span className="lp-icon" aria-hidden="true">👤</span>
                <input
                  className="lp-input"
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  placeholder="Nhập tên đăng nhập"
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="lp-label">
              <span className="lp-labelText">Mật khẩu</span>
              <div className="lp-inputWrap">
                <span className="lp-icon" aria-hidden="true">🔒</span>
                <input
                  className="lp-input"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  type={showPass ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lp-eyeBtn"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPass ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </label>

            {msg.text ? (
              <div className={`lp-alert ${msg.type === "success" ? "ok" : "err"}`} role="status">
                {msg.text}
              </div>
            ) : null}

            <button className="lp-submit" type="submit" disabled={!canSubmit}>
              {loading ? <span className="lp-spinner" aria-hidden="true" /> : null}
              <span>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
            </button>

            <div className="lp-footer">
              <a className="lp-link" href="#" onClick={(e) => e.preventDefault()}>
                Quên mật khẩu?
              </a>
            </div>
          </form>
        </section>

        <p className="lp-note">© {new Date().getFullYear()} — HCMUE</p>
      </main>
    </div>
  );
}
