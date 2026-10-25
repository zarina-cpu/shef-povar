"use client";

import { Float, Outlines, RoundedBox, Sphere } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

const FOOD_TYPES = ["tomato", "egg", "cheese", "bread", "apple", "carrot", "milk"];

function scatterLayout(count, spread = 1) {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const type = FOOD_TYPES[i % FOOD_TYPES.length];
    const angle = i * 2.399963;
    const ring = 2.2 + (i % 5) * 1.15;
    items.push({
      key: `${type}-${i}`,
      type,
      position: [
        Math.cos(angle) * ring * spread,
        Math.sin(angle * 0.85) * (2.8 + (i % 3) * 0.6) * spread,
        -2.2 - (i % 4) * 0.65,
      ],
      speed: 0.55 + (i % 7) * 0.06,
      spin: (i % 2 === 0 ? 1 : -1) * (0.08 + (i % 5) * 0.02),
    });
  }
  return items;
}

const FULL_LAYOUT = scatterLayout(18, 1.05);
const LITE_LAYOUT = scatterLayout(12, 0.85);

function createGhostMaterial(color, outlineColor) {
  return {
    fill: {
      color,
      transparent: true,
      opacity: 0.07,
      roughness: 0.9,
      metalness: 0,
      depthWrite: false,
    },
    outline: {
      color: outlineColor,
      thickness: 0.008,
      opacity: 0.28,
    },
  };
}

function OutlinedSphere({ args, material, outline, ...props }) {
  return (
    <Sphere args={args} {...props}>
      <meshStandardMaterial {...material} />
      <Outlines {...outline} />
    </Sphere>
  );
}

function FoodGlyph({ type, outlineColor, speed, spin }) {
  const root = useRef();

  useFrame((state) => {
    if (!root.current) return;
    root.current.rotation.y += spin * 0.004;
    root.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.25 * speed) * 0.04;
  });

  const s = 0.36;

  if (type === "tomato") {
    const m = createGhostMaterial("#e62222", outlineColor);
    return (
      <group ref={root} scale={s}>
        <OutlinedSphere args={[0.55, 12, 12]} material={m.fill} outline={m.outline} />
      </group>
    );
  }

  if (type === "egg") {
    const shell = createGhostMaterial("#fff8e7", outlineColor);
    const yolk = createGhostMaterial("#e1b12c", outlineColor);
    return (
      <group ref={root} scale={s * 0.95}>
        <group scale={[0.85, 1.05, 0.85]}>
          <OutlinedSphere args={[0.42, 12, 12]} material={shell.fill} outline={shell.outline} />
          <OutlinedSphere
            args={[0.2, 10, 10]}
            position={[0, 0.05, 0.22]}
            material={yolk.fill}
            outline={yolk.outline}
          />
        </group>
      </group>
    );
  }

  if (type === "cheese") {
    const m = createGhostMaterial("#ffd54a", outlineColor);
    return (
      <group ref={root} scale={s} rotation={[0.4, 0.6, 0.2]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 0.28, 3]} />
          <meshStandardMaterial {...m.fill} />
          <Outlines {...m.outline} />
        </mesh>
      </group>
    );
  }

  if (type === "bread") {
    const m = createGhostMaterial("#c68c3a", outlineColor);
    return (
      <group ref={root} scale={s * 0.9}>
        <RoundedBox args={[1.1, 0.45, 0.55]} radius={0.1} smoothness={2}>
          <meshStandardMaterial {...m.fill} />
          <Outlines {...m.outline} />
        </RoundedBox>
      </group>
    );
  }

  if (type === "apple") {
    const m = createGhostMaterial("#c62828", outlineColor);
    return (
      <group ref={root} scale={s}>
        <OutlinedSphere args={[0.48, 12, 12]} material={m.fill} outline={m.outline} />
      </group>
    );
  }

  if (type === "carrot") {
    const m = createGhostMaterial("#f57c00", outlineColor);
    const leaf = createGhostMaterial("#388e3c", outlineColor);
    return (
      <group ref={root} scale={s * 0.85} rotation={[0.8, 0.2, -0.5]}>
        <mesh>
          <coneGeometry args={[0.22, 0.95, 8]} />
          <meshStandardMaterial {...m.fill} />
          <Outlines {...m.outline} />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <coneGeometry args={[0.1, 0.18, 6]} />
          <meshStandardMaterial {...leaf.fill} />
          <Outlines {...leaf.outline} />
        </mesh>
      </group>
    );
  }

  const m = createGhostMaterial("#f5f5f5", outlineColor);
  return (
    <group ref={root} scale={s * 0.8}>
      <RoundedBox args={[0.42, 0.75, 0.42]} radius={0.05} smoothness={2}>
        <meshStandardMaterial {...m.fill} />
        <Outlines {...m.outline} />
      </RoundedBox>
    </group>
  );
}

function Scene({ lite, outlineColor }) {
  const layout = useMemo(() => (lite ? LITE_LAYOUT : FULL_LAYOUT), [lite]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 3]} intensity={0.45} />
      {layout.map(({ key, type, position, speed, spin }) => (
        <Float
          key={key}
          speed={0.35 * speed}
          rotationIntensity={0.08}
          floatIntensity={0.12}
          position={position}
        >
          <FoodGlyph type={type} outlineColor={outlineColor} speed={speed} spin={spin} />
        </Float>
      ))}
    </>
  );
}

export default function FoodBackground3DCanvas({ lite = false, dark = false }) {
  const outlineColor = dark ? "#9ba4a6" : "#3d362f";

  return (
    <Canvas
      camera={{ position: [0, 0, 8.5], fov: 52 }}
      dpr={lite ? [1, 1.15] : [1, 1.35]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <Scene lite={lite} outlineColor={outlineColor} />
    </Canvas>
  );
}
