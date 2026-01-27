import { http } from "./http";

export async function login(username, password) {
  if (!username?.trim() || !password?.trim()) {
    throw new Error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
  }

  return await http("/auth/login", {
    method: "POST",
    auth: false,
    body: { username: username.trim(), password: password.trim() },
  });
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  localStorage.removeItem("full_name");
}
