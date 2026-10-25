"use client";

import { OrthographicCamera, Outlines, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";

/** Бирюза контуров фона — строго #32B3B3 */
const OUTLINE_TEAL = "#32B3B3";
const OUTLINE_OPACITY = 0.42;

const FOOD_TYPES = ["tomato", "wine", "pizza", "milk", "bread", "carrot", "apple", "cheese", "egg"];
const CAMERA_ZOOM = 12.5;

function seeded01(index, salt = 0) {
  const x = Math.sin((index + salt) * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/** Сетка на всю видимую область orthographic-камеры (ширина = viewport / zoom) */
function fullBackgroundLayout(count, viewport, zoom) {
  const aspect = Math.max(viewport.w / viewport.h, 0.75);
  const spanX = (viewport.w / zoom) * 0.98;
  const spanY = (viewport.h / zoom) * 0.96;
  const cols = Math.max(4, Math.ceil(Math.sqrt(count * aspect * 1.15)));
  const rows = Math.ceil(count / cols);
  const cellW = spanX / Math.max(cols - 1, 1);
  const cellH = spanY / Math.max(rows - 1, 1);
  const items = [];

  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const type = FOOD_TYPES[(i + Math.floor(cols / 2)) % FOOD_TYPES.length];
    const u = cols <= 1 ? 0.5 : col / (cols - 1);
    const v = rows <= 1 ? 0.5 : row / (rows - 1);
    const x = (u - 0.5) * spanX + (seeded01(i, 1) - 0.5) * cellW * 0.38;
    const y = (v - 0.5) * spanY + (seeded01(i, 2) - 0.5) * cellH * 0.38;

    const hero = i % 5 === 0;
    const scale = (hero ? 1.78 : 1.4) + seeded01(i, 3) * 0.32;
    const rotZ = (seeded01(i, 4) - 0.5) * Math.PI * 1.35;
    const rotX = (seeded01(i, 5) - 0.5) * 0.28;
    const rotY = (seeded01(i, 6) - 0.5) * 0.38;

    items.push({
      key: `${type}-${i}`,
      type,
      position: [x, y, 0],
      scale,
      rotation: [rotX, rotY, rotZ],
      floatDelay: seeded01(i, 8) * 6,
      floatDuration: 5.5 + seeded01(i, 9) * 3.5,
      floatAmpY: 0.2 + seeded01(i, 10) * 0.14,
      floatAmpX: 0.06 + seeded01(i, 11) * 0.1,
    });
  }

  return items;
}

const outlineProps = {
  color: OUTLINE_TEAL,
  thickness: 0.019,
  opacity: OUTLINE_OPACITY,
};

/** Заливка не рисуется — только контур Outlines */
const invisibleFill = {
  color: OUTLINE_TEAL,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  colorWrite: false,
};

function OutlineShell({ children, ...props }) {
  return (
    <mesh {...props}>
      {children}
      <meshBasicMaterial {...invisibleFill} />
      <Outlines {...outlineProps} />
    </mesh>
  );
}

function OutlinedSphere({ args, ...props }) {
  return (
    <OutlineShell {...props}>
      <sphereGeometry args={args} />
    </OutlineShell>
  );
}

function OutlinedRoundedBox({ args, radius = 0.08, smoothness = 2, ...props }) {
  return (
    <RoundedBox args={args} radius={radius} smoothness={smoothness} {...props}>
      <meshBasicMaterial {...invisibleFill} />
      <Outlines {...outlineProps} />
    </RoundedBox>
  );
}

function TomatoShape() {
  return (
    <group>
      <OutlinedSphere args={[0.52, 14, 14]} scale={[1, 0.88, 1]} />
      <OutlineShell position={[0, 0.46, 0.08]} rotation={[0.15, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.12, 6]} />
      </OutlineShell>
      <OutlineShell position={[0.1, 0.5, 0.1]} rotation={[0.5, 0, -0.8]}>
        <coneGeometry args={[0.08, 0.16, 4]} />
      </OutlineShell>
      <OutlineShell position={[-0.08, 0.48, 0.12]} rotation={[0.4, 0.2, 0.7]}>
        <coneGeometry args={[0.07, 0.14, 4]} />
      </OutlineShell>
    </group>
  );
}

function WineShape() {
  return (
    <group>
      <OutlineShell position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.68, 14]} />
      </OutlineShell>
      <OutlineShell position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.34, 0.14, 0.24, 14]} />
      </OutlineShell>
      <OutlineShell position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.36, 10]} />
      </OutlineShell>
      <OutlineShell position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.14, 10]} />
      </OutlineShell>
    </group>
  );
}

function PizzaShape() {
  const sliceStart = 0.15;
  const sliceAngle = Math.PI / 3.2;
  return (
    <group rotation={[Math.PI / 2.2, 0.35, 0]}>
      <OutlineShell>
        <cylinderGeometry args={[0.82, 0.82, 0.1, 20, 1, false, sliceStart, sliceAngle]} />
      </OutlineShell>
      <OutlineShell position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.16, 20, 1, false, sliceStart, sliceAngle]} />
      </OutlineShell>
      <OutlinedSphere args={[0.09, 8, 8]} position={[0.22, 0.12, 0.15]} />
      <OutlinedSphere args={[0.08, 8, 8]} position={[0.38, 0.11, -0.05]} />
      <OutlinedSphere args={[0.07, 8, 8]} position={[0.12, 0.11, -0.18]} />
    </group>
  );
}

function MilkShape() {
  return (
    <group>
      <OutlinedRoundedBox args={[0.52, 0.78, 0.34]} radius={0.04} position={[0, -0.04, 0]} />
      <OutlineShell position={[-0.14, 0.38, 0]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[0.34, 0.06, 0.36]} />
      </OutlineShell>
      <OutlineShell position={[0.14, 0.38, 0]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[0.34, 0.06, 0.36]} />
      </OutlineShell>
      <OutlineShell position={[0, 0.48, 0]}>
        <coneGeometry args={[0.1, 0.14, 4]} />
      </OutlineShell>
    </group>
  );
}

function BreadShape() {
  return (
    <group rotation={[0, 0.25, 0]}>
      <OutlinedRoundedBox args={[1.05, 0.42, 0.48]} radius={0.16} position={[0, -0.06, 0]} />
      <OutlinedRoundedBox args={[0.88, 0.28, 0.42]} radius={0.14} position={[0, 0.22, 0]} />
      <OutlineShell position={[-0.2, 0.28, 0.22]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.04, 0.32, 0.02]} />
      </OutlineShell>
      <OutlineShell position={[0.05, 0.3, 0.22]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.04, 0.28, 0.02]} />
      </OutlineShell>
      <OutlineShell position={[0.28, 0.26, 0.22]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[0.04, 0.26, 0.02]} />
      </OutlineShell>
    </group>
  );
}

function CarrotShape() {
  return (
    <group rotation={[0.75, 0.15, -0.45]}>
      <OutlineShell>
        <coneGeometry args={[0.2, 0.92, 10]} />
      </OutlineShell>
      <OutlineShell position={[0.06, 0.48, 0.02]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.06, 0.22, 5]} />
      </OutlineShell>
      <OutlineShell position={[-0.05, 0.5, -0.02]} rotation={[0.2, 0, 0.5]}>
        <coneGeometry args={[0.05, 0.2, 5]} />
      </OutlineShell>
      <OutlineShell position={[0, 0.52, 0.06]} rotation={[-0.3, 0, 0]}>
        <coneGeometry args={[0.05, 0.18, 5]} />
      </OutlineShell>
    </group>
  );
}

function AppleShape() {
  return (
    <group>
      <OutlinedSphere args={[0.5, 14, 14]} scale={[0.96, 1, 0.96]} />
      <OutlineShell position={[0.02, 0.46, 0.08]}>
        <cylinderGeometry args={[0.03, 0.04, 0.14, 6]} />
      </OutlineShell>
      <OutlineShell position={[0.12, 0.52, 0.1]} rotation={[0.3, 0, -1.1]}>
        <coneGeometry args={[0.09, 0.18, 4]} />
      </OutlineShell>
    </group>
  );
}

function CheeseShape() {
  return (
    <group rotation={[0.5, 0.55, 0.35]}>
      <OutlineShell>
        <cylinderGeometry args={[0.55, 0.55, 0.32, 3]} />
      </OutlineShell>
      <OutlineShell position={[0.18, 0.08, 0.12]}>
        <sphereGeometry args={[0.07, 8, 8]} />
      </OutlineShell>
      <OutlineShell position={[-0.08, -0.04, 0.14]}>
        <sphereGeometry args={[0.06, 8, 8]} />
      </OutlineShell>
      <OutlineShell position={[0.02, 0.12, -0.1]}>
        <sphereGeometry args={[0.05, 8, 8]} />
      </OutlineShell>
    </group>
  );
}

function EggShape() {
  return (
    <group scale={[0.82, 1.08, 0.82]}>
      <OutlinedSphere args={[0.44, 14, 14]} />
    </group>
  );
}

const FOOD_SHAPES = {
  tomato: TomatoShape,
  wine: WineShape,
  pizza: PizzaShape,
  milk: MilkShape,
  bread: BreadShape,
  carrot: CarrotShape,
  apple: AppleShape,
  cheese: CheeseShape,
  egg: EggShape,
};

function FoodGlyph({ type, scale, rotation, floatDelay, floatDuration, floatAmpY, floatAmpX }) {
  const root = useRef();
  const baseRotZ = rotation[2];

  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime + floatDelay;
    const angle = (t * Math.PI * 2) / floatDuration;
    const driftY = Math.sin(angle) * floatAmpY;
    const driftX = Math.sin(angle * 0.72 + floatDelay) * floatAmpX;
    root.current.position.set(driftX, driftY, 0);
    root.current.rotation.z = baseRotZ + Math.sin(angle) * 0.052;
  });

  const s = scale;
  const Shape = FOOD_SHAPES[type] ?? TomatoShape;

  return (
    <group ref={root} scale={s} rotation={rotation}>
      <Shape />
    </group>
  );
}

function Scene({ lite, viewport }) {
  const count = lite ? 30 : 42;
  const layout = useMemo(
    () => fullBackgroundLayout(count, viewport, CAMERA_ZOOM),
    [lite, viewport.w, viewport.h, count]
  );

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={CAMERA_ZOOM} near={0.1} far={100} />
      <ambientLight intensity={0.65} />
      {layout.map(
        ({
          key,
          type,
          position,
          scale,
          rotation,
          floatDelay,
          floatDuration,
          floatAmpY,
          floatAmpX,
        }) => (
          <group key={key} position={position}>
            <FoodGlyph
              type={type}
              scale={scale}
              rotation={rotation}
              floatDelay={floatDelay}
              floatDuration={floatDuration}
              floatAmpY={floatAmpY}
              floatAmpX={floatAmpX}
            />
          </group>
        )
      )}
    </>
  );
}

export default function FoodBackground3DCanvas({ lite = false }) {
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    function update() {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <Canvas
      dpr={lite ? [1, 1.15] : [1, 1.35]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
      style={{ width: "100%", height: "100%", display: "block", background: "transparent" }}
    >
      <Scene lite={lite} viewport={viewport} />
    </Canvas>
  );
}
