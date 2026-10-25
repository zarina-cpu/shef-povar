"use client";

import { OrthographicCamera, Outlines, RoundedBox, Sphere } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";

/** Как кнопка «Хочу приготовить» — --eye-teal */
const WANT_COOK_COLOR = "#32b3b3";

const FOOD_TYPES = ["tomato", "egg", "cheese", "bread", "apple", "carrot", "milk"];

function seeded01(index, salt = 0) {
  const x = Math.sin((index + salt) * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/** Рассыпь по всему полю, как doodle-паттерн на референсе */
function doodleLayout(count, aspect) {
  const radiusX = 6.8 * Math.max(aspect, 1);
  const radiusY = 5.6;
  const phi = Math.PI * (3 - Math.sqrt(5));
  const items = [];

  for (let i = 0; i < count; i += 1) {
    const type = FOOD_TYPES[i % FOOD_TYPES.length];
    const t = (i + 0.5) / count;
    const r = Math.sqrt(t);
    const theta = phi * i;
    let x = r * Math.cos(theta) * radiusX;
    let y = r * Math.sin(theta) * radiusY;
    x += (seeded01(i, 1) - 0.5) * 1.4;
    y += (seeded01(i, 2) - 0.5) * 1.1;

    const hero = i % 6 === 0;
    const scale = (hero ? 0.38 : 0.24) + seeded01(i, 3) * 0.12;
    const rotZ = (seeded01(i, 4) - 0.5) * Math.PI * 1.35;
    const rotX = (seeded01(i, 5) - 0.5) * 0.25;
    const rotY = (seeded01(i, 6) - 0.5) * 0.35;

    items.push({
      key: `${type}-${i}`,
      type,
      position: [x, y, 0],
      scale,
      rotation: [rotX, rotY, rotZ],
      spin: (seeded01(i, 7) - 0.5) * 0.025,
    });
  }

  return items;
}

function createGhostMaterial(color = WANT_COOK_COLOR) {
  return {
    fill: {
      color,
      transparent: true,
      opacity: 0.04,
      roughness: 1,
      metalness: 0,
      depthWrite: false,
    },
    outline: {
      color,
      thickness: 0.007,
      opacity: 0.5,
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

function FoodGlyph({ type, ghost, scale, rotation, spin }) {
  const root = useRef();

  useFrame((state) => {
    if (!root.current) return;
    root.current.rotation.z += spin * 0.002;
  });

  const s = scale;
  const m = ghost;

  return (
    <group ref={root} scale={s} rotation={rotation}>
      {type === "tomato" && (
        <OutlinedSphere args={[0.55, 10, 10]} material={m.fill} outline={m.outline} />
      )}
      {type === "egg" && (
        <group scale={[0.85, 1.05, 0.85]}>
          <OutlinedSphere args={[0.42, 10, 10]} material={m.fill} outline={m.outline} />
          <OutlinedSphere
            args={[0.2, 8, 8]}
            position={[0, 0.05, 0.22]}
            material={m.fill}
            outline={m.outline}
          />
        </group>
      )}
      {type === "cheese" && (
        <group rotation={[0.4, 0.6, 0.2]}>
          <mesh>
            <cylinderGeometry args={[0.5, 0.5, 0.28, 3]} />
            <meshStandardMaterial {...m.fill} />
            <Outlines {...m.outline} />
          </mesh>
        </group>
      )}
      {type === "bread" && (
        <RoundedBox args={[1.1, 0.45, 0.55]} radius={0.1} smoothness={2}>
          <meshStandardMaterial {...m.fill} />
          <Outlines {...m.outline} />
        </RoundedBox>
      )}
      {type === "apple" && (
        <OutlinedSphere args={[0.48, 10, 10]} material={m.fill} outline={m.outline} />
      )}
      {type === "carrot" && (
        <group rotation={[0.8, 0.2, -0.5]}>
          <mesh>
            <coneGeometry args={[0.22, 0.95, 8]} />
            <meshStandardMaterial {...m.fill} />
            <Outlines {...m.outline} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <coneGeometry args={[0.1, 0.18, 6]} />
            <meshStandardMaterial {...m.fill} />
            <Outlines {...m.outline} />
          </mesh>
        </group>
      )}
      {type === "milk" && (
        <RoundedBox args={[0.42, 0.75, 0.42]} radius={0.05} smoothness={2}>
          <meshStandardMaterial {...m.fill} />
          <Outlines {...m.outline} />
        </RoundedBox>
      )}
    </group>
  );
}

function Scene({ lite, accentColor, aspect }) {
  const count = lite ? 26 : 32;
  const layout = useMemo(() => doodleLayout(count, aspect), [lite, aspect, count]);
  const ghost = useMemo(() => createGhostMaterial(accentColor), [accentColor]);

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={42} near={0.1} far={100} />
      <ambientLight intensity={0.65} />
      {layout.map(({ key, type, position, scale, rotation, spin }) => (
        <group key={key} position={position}>
          <FoodGlyph
            type={type}
            ghost={ghost}
            scale={scale}
            rotation={rotation}
            spin={spin}
          />
        </group>
      ))}
    </>
  );
}

export default function FoodBackground3DCanvas({ lite = false, accentColor = WANT_COOK_COLOR }) {
  const [aspect, setAspect] = useState(1.6);

  useEffect(() => {
    function update() {
      setAspect(Math.max(window.innerWidth / window.innerHeight, 0.75));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <Canvas
      dpr={lite ? [1, 1.15] : [1, 1.35]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <Scene lite={lite} accentColor={accentColor} aspect={aspect} />
    </Canvas>
  );
}
