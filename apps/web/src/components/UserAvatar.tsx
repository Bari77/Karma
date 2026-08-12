import clsx from "clsx";
import { getAvatarUrl } from "@/lib/avatar";

const SIZES = {
  sm: "h-8 w-8 text-xs rounded-lg",
  md: "h-12 w-12 text-sm rounded-xl",
  lg: "h-20 w-20 text-xl rounded-2xl",
} as const;

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export function UserAvatar({
  username,
  avatarUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const src = getAvatarUrl(avatarUrl);
  const initials = username.slice(0, 2).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={`Avatar de ${username}`}
        className={clsx(
          "shrink-0 object-cover ring-1 ring-purple-500/30",
          SIZES[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center bg-gradient-to-br from-cyan-500/25 to-purple-600/35 font-game font-bold text-cyan-200",
        SIZES[size],
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
