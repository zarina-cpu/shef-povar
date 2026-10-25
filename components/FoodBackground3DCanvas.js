"use client";

import { Float, RoundedBox, Sphere } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

function Tomato({ position, speed = 1 }) {
  const group = useRef();
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.25 * speed;
  });
  return (
    <Float speed={1.2 * speed} rotationIntensity={0.35} floatIntensity={0.6}>
      <group ref={group} position={position}>
        <Sphere args={[0.55, 24, 24]}>
          <meshStandardMaterial color="#e62222" roughness={0.45} metalness={0.05} />
        </Sphere>
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[0.08, 0.12, 0.04]} />
          <meshStandardMaterial color="#3d7a34" roughness={0.8} />
        </mesh>
      </group>
    </Float>
  );
}

function Egg({ position, speed = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 * speed) * 0.15;
  });
  return (
    <Float speed={1 * speed} rotationIntensity={0.5} floatIntensity={0.45}>
      <group ref={ref} position={position} scale={[0.85, 1.05, 0.85]}>
        <Sphere args={[0.42, 20, 20]}>
          <meshStandardMaterial color="#fff8e7" roughness={0.35} metalness={0.02} />
        </Sphere>
        <Sphere args={[0.22, 16, 16]} position={[0, 0.05, 0.26]}>
          <meshStandardMaterial color="#e1b12c" roughness={0.5} emissive="#e1b12c" emissiveIntensity={0.08} />
        </Sphere>
      </group>
    </Float>
  );
}

function Cheese({ position, speed = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
  });
  return (
    <Float speed={0.9 * speed} rotationIntensity={0.4} floatIntensity={0.5}>
      <mesh ref={ref} position={position} rotation={[0.4, 0.6, 0.2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.28, 3]} />
        <meshStandardMaterial color="#ffd54a" roughness={0.55} metalness={0.03} />
      </mesh>
    </Float>
  );
}

function Bread({ position, speed = 1 }) {
  return (
    <Float speed={1.1 * speed} rotationIntensity={0.3} floatIntensity={0.55}>
      <RoundedBox args={[1.1, 0.45, 0.55]} radius={0.12} smoothness={4} position={position}>
        <meshStandardMaterial color="#c68c3a" roughness={0.7} metalness={0.02} />
      </RoundedBox>
    </Float>
  );
}

function Apple({ position, speed = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35 * speed) * 0.12;
  });
  return (
    <Float speed={1.15 * speed} rotationIntensity={0.45} floatIntensity={0.5}>
      <group ref={ref} position={position}>
        <Sphere args={[0.48, 22, 22]}>
          <meshStandardMaterial color="#c62828" roughness={0.4} metalness={0.06} />
        </Sphere>
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.025, 0.02, 0.14, 6]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
      </group>
    </Float>
  );
}

function Carrot({ position, speed = 1 }) {
  return (
    <Float speed={1.05 * speed} rotationIntensity={0.55} floatIntensity={0.48}>
      <group position={position} rotation={[0.8, 0.2, -0.5]}>
        <mesh>
          <coneGeometry args={[0.22, 0.95, 12]} />
          <meshStandardMaterial color="#f57c00" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <coneGeometry args={[0.12, 0.2, 8]} />
          <meshStandardMaterial color="#388e3c" roughness={0.75} />
        </mesh>
      </group>
    </Float>
  );
}

function Milk({ position, speed = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = -state.clock.elapsedTime * 0.22 * speed;
  });
  return (
    <Float speed={0.85 * speed} rotationIntensity={0.25} floatIntensity={0.4}>
      <group ref={ref} position={position}>
        <RoundedBox args={[0.42, 0.75, 0.42]} radius={0.06} smoothness={3}>
          <meshStandardMaterial color="#f5f5f5" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0.42, 0]}>
          <coneGeometry args={[0.24, 0.18, 4]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

const FULL_ITEMS = [
  { key: "tomato", Component: Tomato, position: [-3.8, 1.2, -2.5], speed: 1 },
  { key: "egg", Component: Egg, position: [3.6, -0.4, -3], speed: 1.1 },
  { key: "cheese", Component: Cheese, position: [-2.2, -1.4, -2.8], speed: 0.95 },
  { key: "bread", Component: Bread, position: [2.4, 1.6, -3.2], speed: 0.9 },
  { key: "apple", Component: Apple, position: [4.2, 0.6, -2.2], speed: 1.05 },
  { key: "carrot", Component: Carrot, position: [-4.5, -0.2, -3.5], speed: 1.15 },
  { key: "milk", Component: Milk, position: [0.5, -1.8, -2.6], speed: 0.88 },
  { key: "tomato2", Component: Tomato, position: [1.8, 2.1, -4], speed: 0.82 },
];

const LITE_ITEMS = [
  { key: "tomato", Component: Tomato, position: [-2.2, 1, -2.8], speed: 0.9 },
  { key: "egg", Component: Egg, position: [2.4, -0.6, -3], speed: 1 },
  { key: "cheese", Component: Cheese, position: [-1.2, -1.2, -2.5], speed: 0.85 },
  { key: "bread", Component: Bread, position: [1.6, 1.4, -3], speed: 0.88 },
];

function Scene({ lite }) {
  const items = useMemo(() => (lite ? LITE_ITEMS : FULL_ITEMS), [lite]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 8, 4]} intensity={1.1} />
      <directionalLight position={[-4, -2, 2]} intensity={0.35} color="#fff4c4" />
      {items.map(({ key, Component, position, speed }) => (
        <Component key={key} position={position} speed={speed} />
      ))}
    </>
  );
}

export default function FoodBackground3DCanvas({ lite = false }) {
  return (
    <Canvas
      camera={{ position: [0, 0, lite ? 7 : 6], fov: lite ? 48 : 42 }}
      dpr={lite ? [1, 1.25] : [1, 1.5]}
      gl={{ antialias: !lite, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <Scene lite={lite} />
    </Canvas>
  );
}
