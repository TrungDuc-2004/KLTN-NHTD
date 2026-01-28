import { http } from "./http";

export async function listFiles({ classId, typeName, recursive = true, limit = 500 }) {
  const qs = new URLSearchParams({
    class_id: String(classId),
    type_name: String(typeName),
    recursive: String(recursive),
    limit: String(limit),
  });

  return await http(`/admin/minio/files?${qs.toString()}`);
}
