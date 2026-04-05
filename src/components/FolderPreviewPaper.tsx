import { HalftoneDots } from '@paper-design/shaders-react';

type Props = {
  src: string;
  alt: string;
  className?: string;
};

export default function FolderPreviewPaper({ src, alt, className = '' }: Props) {
  return (
    <div className={`folder-preview-paper ${className}`.trim()} aria-hidden="true">
      <img className="folder-preview-paper__img" src={src} alt={alt} loading="lazy" decoding="async" />

      <div className="folder-preview-paper__shader" aria-hidden="true">
        <HalftoneDots
          width={960}
          height={720}
          image={src}
          colorBack="#f3f0e6"
          colorFront="#1f1f1f"
          originalColors={false}
          type="gooey"
          grid="hex"
          inverted={false}
          size={0.48}
          radius={1.2}
          contrast={0.46}
          grainMixer={0.24}
          grainOverlay={0.16}
          grainSize={0.42}
          fit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
