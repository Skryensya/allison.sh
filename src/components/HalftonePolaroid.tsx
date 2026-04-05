import { HalftoneDots } from '@paper-design/shaders-react';

type Props = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  showCaption?: boolean;
};

export default function HalftonePolaroid({
  src,
  alt,
  caption,
  className = '',
  showCaption = true,
}: Props) {
  return (
    <figure className={`halftone-polaroid group ${className}`.trim()}>
      <div className="halftone-polaroid__frame">
        <div className="halftone-polaroid__media">
          <img className="halftone-polaroid__img" src={src} alt={alt} loading="lazy" />

          <div className="halftone-polaroid__shader" aria-hidden="true">
            <HalftoneDots
              width={1280}
              height={720}
              image={src}
              colorBack="#f2f1e8"
              colorFront="#2b2b2b"
              originalColors={false}
              type="gooey"
              grid="hex"
              inverted={false}
              size={0.5}
              radius={1.25}
              contrast={0.4}
              grainMixer={0.2}
              grainOverlay={0.2}
              grainSize={0.5}
              fit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {showCaption ? (
          <figcaption className="halftone-polaroid__caption">{caption ?? alt}</figcaption>
        ) : null}
      </div>
    </figure>
  );
}
