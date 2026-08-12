import fs from "fs/promises";
import path from "path";

const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function ensureAvatarDir() {
  await fs.mkdir(AVATAR_DIR, { recursive: true });
}

export function avatarPublicPath(userId: string, ext: string) {
  return `/uploads/avatars/${userId}${ext}`;
}

export function avatarDiskPath(userId: string, ext: string) {
  return path.join(AVATAR_DIR, `${userId}${ext}`);
}

export async function removeUserAvatarFiles(userId: string) {
  const files = await fs.readdir(AVATAR_DIR).catch(() => [] as string[]);
  await Promise.all(
    files
      .filter((f) => f.startsWith(userId))
      .map((f) => fs.unlink(path.join(AVATAR_DIR, f)).catch(() => undefined))
  );
}

export async function saveUserAvatar(
  userId: string,
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  if (!ALLOWED.has(mimetype)) {
    throw new Error("Format d'image non supporté (JPEG, PNG, WebP, GIF)");
  }
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error("Image trop volumineuse (max 2 Mo)");
  }

  const ext = EXT_BY_MIME[mimetype];
  await ensureAvatarDir();
  await removeUserAvatarFiles(userId);
  await fs.writeFile(avatarDiskPath(userId, ext), buffer);
  return avatarPublicPath(userId, ext);
}
