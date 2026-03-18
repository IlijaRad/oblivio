import { getHref, isUrl, URL_REGEX } from "@/lib/utils";

export default function linkify(text: string): React.ReactNode[] {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (!isUrl(part)) return part;
    return (
      <a
        key={i}
        href={getHref(part)}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 opacity-90 hover:opacity-100 break-all"
      >
        {part}
      </a>
    );
  });
}
