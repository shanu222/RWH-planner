// Stroke icons on a 24-unit grid (drawn for this app, no icon font needed).
import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type IconName =
  | "drop" | "receipt" | "learn" | "spark" | "menu" | "chevron" | "back" | "search" | "share" | "download" | "edit" | "copy" | "trash"
  | "bell" | "refresh" | "offline" | "close" | "check" | "plus" | "minus" | "sun" | "moon" | "globe" | "info" | "mail" | "star" | "file"
  | "play" | "home" | "calendar" | "book" | "folder" | "send" | "ruler" | "tank" | "well" | "shield" | "megaphone" | "external" | "settings" | "phone";

export function Icon({ name, size = 24, color = "#000", stroke = 2, flip = false }: { name: IconName; size?: number; color?: string; stroke?: number; flip?: boolean }) {
  const p = { stroke: color, strokeWidth: stroke, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const f = { fill: color };
  const body = (() => {
    switch (name) {
      case "drop": return <Path {...p} d="M12 3.5c-3.3 4.4-6 7.7-6 10.9a6 6 0 0 0 12 0c0-3.2-2.7-6.5-6-10.9z M9.2 14.6a2.9 2.9 0 0 0 2.8 2.7" />;
      case "receipt": return <Path {...p} d="M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6 M9 16h3" />;
      case "learn": return <><Rect {...p} x="3" y="5" width="18" height="13" rx="2.5" /><Path {...f} d="M10.5 9.2v4.6l4-2.3z" /><Path {...p} d="M8 21h8" /></>;
      case "spark": return <Path {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />;
      case "menu": return <><Circle {...f} cx="5.5" cy="12" r="1.7" /><Circle {...f} cx="12" cy="12" r="1.7" /><Circle {...f} cx="18.5" cy="12" r="1.7" /></>;
      case "chevron": return <Path {...p} d="M9 5l7 7-7 7" />;
      case "back": return <Path {...p} d="M15 5l-7 7 7 7" />;
      case "search": return <><Circle {...p} cx="10.5" cy="10.5" r="6" /><Path {...p} d="M15 15l5 5" /></>;
      case "share": return <><Circle {...p} cx="17" cy="5.5" r="2.5" /><Circle {...p} cx="6" cy="12" r="2.5" /><Circle {...p} cx="17" cy="18.5" r="2.5" /><Path {...p} d="M8.3 10.8l6.4-3.9 M8.3 13.2l6.4 3.9" /></>;
      case "download": return <Path {...p} d="M12 4v11 M7 10.5l5 5 5-5 M5 20h14" />;
      case "edit": return <Path {...p} d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4" />;
      case "copy": return <><Rect {...p} x="8" y="8" width="12" height="12" rx="2" /><Path {...p} d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>;
      case "trash": return <Path {...p} d="M4 7h16 M9.5 7V4.5h5V7 M6.5 7l1 13h9l1-13 M10 11v5 M14 11v5" />;
      case "bell": return <Path {...p} d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20.5a2 2 0 0 0 4 0" />;
      case "refresh": return <Path {...p} d="M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7" />;
      case "offline": return <Path {...p} d="M3 3l18 18 M8.5 16.5a5 5 0 0 1 7 0 M5 12.8a10 10 0 0 1 4.1-2.4 M19 12.8a10 10 0 0 0-3-2 M2 9a14.5 14.5 0 0 1 4.5-2.8 M22 9a14.5 14.5 0 0 0-11-3.8 M12 20h.01" />;
      case "close": return <Path {...p} d="M6 6l12 12 M18 6L6 18" />;
      case "check": return <Path {...p} d="M5 12.5l4.5 4.5L19 7.5" />;
      case "plus": return <Path {...p} d="M12 5v14 M5 12h14" />;
      case "minus": return <Path {...p} d="M5 12h14" />;
      case "sun": return <><Circle {...p} cx="12" cy="12" r="4" /><Path {...p} d="M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4" /></>;
      case "moon": return <Path {...p} d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />;
      case "globe": return <><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M3 12h18 M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" /></>;
      case "info": return <><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M12 11v5.5" /><Circle {...f} cx="12" cy="7.8" r="1.2" /></>;
      case "mail": return <><Rect {...p} x="3" y="5" width="18" height="14" rx="2.5" /><Path {...p} d="M3.5 7l8.5 6 8.5-6" /></>;
      case "star": return <Path {...p} d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />;
      case "file": return <Path {...p} d="M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M9 16h6" />;
      case "play": return <Path {...f} d="M8 5.5v13l10.5-6.5z" />;
      case "home": return <Path {...p} d="M3.5 11L12 4l8.5 7 M6 9.5V20h12V9.5" />;
      case "calendar": return <><Rect {...p} x="3.5" y="5" width="17" height="15.5" rx="2.5" /><Path {...p} d="M3.5 10h17 M8 3v4 M16 3v4" /></>;
      case "book": return <Path {...p} d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />;
      case "folder": return <Path {...p} d="M3 6.5A1.5 1.5 0 0 1 4.5 5H10l2 2.5h7.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />;
      case "send": return <Path {...p} d="M4 12l16-8-6 16-2.5-6.5z M11.5 13.5L20 4" />;
      case "ruler": return <Path {...p} d="M3 16.5L16.5 3 21 7.5 7.5 21z M7 12.5l2 2 M10 9.5l2 2 M13 6.5l2 2" />;
      case "tank": return <><Rect {...p} x="5" y="5" width="14" height="15" rx="3" /><Path {...p} d="M5 12c2.3 1.2 4.7 1.2 7 0s4.7-1.2 7 0 M9 3h6" /></>;
      case "well": return <><Path {...p} d="M6 6.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5S15.3 4 12 4 6 5.1 6 6.5z M6 6.5V18c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6.5" /><Path {...p} d="M6 13c2 1 4 1 6 0s4-1 6 0" /></>;
      case "shield": return <Path {...p} d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z M8.8 12l2.3 2.3 4.2-4.3" />;
      case "megaphone": return <Path {...p} d="M4 10v4h3l7 4.5v-13L7 10z M17.5 9a4 4 0 0 1 0 6 M7 14l1.5 5.5" />;
      case "external": return <Path {...p} d="M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />;
      case "settings": return <><Circle {...p} cx="12" cy="12" r="3" /><Path {...p} d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.9a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.4A7.5 7.5 0 0 0 7 6.4l-2.4-.9-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.9a7.5 7.5 0 0 0 2.6 1.5l.4 2.4h4l.4-2.4a7.5 7.5 0 0 0 2.6-1.5l2.4.9 2-3.4z" /></>;
      case "phone": return <Rect {...p} x="6" y="2.5" width="12" height="19" rx="2.5" />;
    }
  })();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      {body}
    </Svg>
  );
}
