import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

// 后处理：泛光 + 暗角，增强氛围。
export default function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.2} darkness={0.55} />
    </EffectComposer>
  );
}
