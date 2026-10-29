// The illustration at the top of a page card (Figma "doc card" 1473-791 and
// "science" 1477-824): a wide crop of the picture. The whole card is the
// button, so the banner carries no arrow of its own.
export function CardBanner({ src }: { src: string }) {
  return (
    <span className="relative block aspect-[7/5] overflow-hidden rounded-[20px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="absolute top-1/2 left-0 w-full -translate-y-1/2" />
    </span>
  );
}
