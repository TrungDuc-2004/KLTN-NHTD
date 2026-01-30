import { http } from "./http";

export async function listDocuments({ classId, typeName, q = "", limit = 500 }) {
  const qs = new URLSearchParams({
    class_id: String(classId),
    type_name: String(typeName),
    q: String(q || ""),
    limit: String(limit),
  });

  return await http(`/admin/documents?${qs.toString()}`);
}

export async function getDocumentDetail({ id, typeName = "" }) {
  const qs = new URLSearchParams();
  if (typeName) qs.set("type_name", String(typeName));
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  return await http(`/admin/documents/${encodeURIComponent(id)}${tail}`);
}
