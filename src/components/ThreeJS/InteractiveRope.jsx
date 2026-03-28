import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { useDrag } from '@use-gesture/react';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';

// Procedural dynamic line reflecting exact coordinates in realtime without freezing renders
const RopeLine = ({ endPointSpring, anchorPoint, scaleOffset, topOffset }) => {
  const lineRef = useRef();

  useFrame(() => {
    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position.array;
      const endPos = endPointSpring.get(); // Real-time vector fetch from physics map
      
      // Point 0 mapping to Absolute Anchor
      positions[0] = anchorPoint[0];
      positions[1] = anchorPoint[1];
      positions[2] = anchorPoint[2];

      // Point 1 mapping dynamically to Mesh top edge
      positions[3] = endPos[0];
      positions[4] = endPos[1] + (topOffset * scaleOffset); 
      positions[5] = endPos[2];

      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array(6)}
          itemSize={3}
        />
      </bufferGeometry>
      {/* High-tension rubber line aesthetics */}
      <lineBasicMaterial attach="material" color="white" transparent opacity={0.3} linewidth={1} />
    </line>
  );
};

const DraggableGraph = ({ initialX, initialY, scale, barColor, mass, tension, bars, type = 'bar' }) => {
  const { size, viewport } = useThree();
  const aspect = size.width / viewport.width;

  const restingPosition = [initialX, initialY, 0]; 
  const anchorPoint = [initialX, viewport.height / 2 + 3, 0]; // Anchored directly above off screen

  // Multi-axis physics map tracking X, Y, Z position and 3D rotation for realistic impact
  const [{ position, rotation }, api] = useSpring(() => ({
    position: restingPosition,
    rotation: [0, 0, 0],
    scale: [scale, scale, scale],
    config: { mass: mass, tension: tension, friction: 18 }
  }));

  // Bind pointer and release velocity for momentum-based 'hit' interaction
  const bind = useDrag(({ movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], down, active }) => {
    if (active) {
      document.body.style.cursor = 'grabbing';
      // Dragging physics: Tilt the object slightly as it moves
      api.start({ 
        position: [restingPosition[0] + mx / aspect, restingPosition[1] - my / aspect, 0],
        rotation: [-my * 0.005, mx * 0.005, 0], 
        immediate: true 
      });
    } else {
      document.body.style.cursor = 'auto';
      // RELEASE MOMENTUM: Create the "hit in the front" impact effect
      const hitZ = Math.min((Math.abs(vx) + Math.abs(vy)) * 2, 4);
      api.start({ 
        to: [
          { 
            position: [restingPosition[0], restingPosition[1], hitZ], 
            rotation: [dy * 0.5, -dx * 0.5, 0],
            config: { tension: 800, friction: 10 } 
          },
          { 
            position: restingPosition, 
            rotation: [0, 0, 0],
            config: { mass: mass, tension: tension, friction: 14 } 
          }
        ],
        immediate: false
      });
    }
  }, {
    from: () => [0, 0]
  });

  const topOffset = type === 'js' ? 0.7 : 1.25;

  return (
    <>
      <RopeLine endPointSpring={position} anchorPoint={anchorPoint} scaleOffset={scale} topOffset={topOffset} />
      
      <animated.group 
        {...bind()} 
        position={position} 
        rotation={rotation}
        scale={[scale, scale, scale]}
        onPointerOver={() => document.body.style.cursor = 'grab'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        {/* Soft frosted gray background plate specifically disabled on JS cube isolation */}
        {type !== 'js' && (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4, 2.5, 0.4]} />
            <meshPhysicalMaterial 
              color="#475569" 
              metalness={0.5} 
              roughness={0.2} 
              clearcoat={0.5}
              transparent
              opacity={0.3}
            />
          </mesh>
        )}
        
        {/* Dynamically Generate 3D Visuals Based on explicitly declared Graph Type */}
        {type === 'bar' && bars.map((h, i) => (
          <mesh key={`bar-${i}`} position={[-1.2 + (i * 0.8), (h / 2) - 1, 0.25]} castShadow>
            <boxGeometry args={[0.4, h, 0.2]} />
            <meshStandardMaterial color={i === 0 ? barColor : '#6366f1'} roughness={0.2} />
          </mesh>
        ))}

        {type === 'horizontal' && bars.map((w, i) => (
          <mesh key={`horz-${i}`} position={[-1.5 + (w / 2), 0.6 - (i * 0.6), 0.25]} castShadow>
            <boxGeometry args={[w, 0.3, 0.2]} />
            <meshStandardMaterial color={i === 0 ? barColor : '#10b981'} roughness={0.2} />
          </mesh>
        ))}

        {type === 'round' && (
          <group position={[0, 0, 0.3]}>
            <mesh castShadow>
              <torusGeometry args={[0.8, 0.25, 16, 50, Math.PI * 1.4]} />
              <meshStandardMaterial color={barColor} roughness={0.2} />
            </mesh>
            <mesh castShadow rotation={[0, 0, Math.PI * 1.4]}>
              <torusGeometry args={[0.8, 0.25, 16, 50, Math.PI * 0.6]} />
              <meshStandardMaterial color="#f43f5e" roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* Custom Pure WebGL React Logo Geometry */}
        {type === 'react' && (
          <group position={[0, 0, 0.4]}>
            {/* Core Nucleus with Emissive Glow */}
            <mesh castShadow>
              <sphereGeometry args={[0.22, 32, 32]} />
              <meshStandardMaterial color="#61dafb" emissive="#61dafb" emissiveIntensity={0.5} roughness={0.1} metalness={0.8} />
            </mesh>
            {/* High-Resolution Orbitals */}
            {[0, Math.PI / 3, -Math.PI / 3].map((r, i) => (
              <mesh key={i} castShadow rotation={[0, 0, r]}>
                <torusGeometry args={[0.8, 0.04, 16, 128]} />
                <meshStandardMaterial color="#61dafb" roughness={0.1} metalness={0.5} />
              </mesh>
            ))}
          </group>
        )}

        {/* Custom Pure 3D Professional JS Logo */}
        {type === 'js' && (
          <group position={[0, 0, 0.2]}>
            <mesh castShadow>
              <boxGeometry args={[1.4, 1.4, 0.4]} />
              <meshStandardMaterial color="#f7df1e" roughness={0.3} metalness={0.1} />
            </mesh>
            <Text
              position={[0.3, -0.3, 0.21]}
              fontSize={0.7}
              color="black"
              anchorX="center"
              anchorY="middle"
              fontWeight="900"
            >
              JS
            </Text>
          </group>
        )}
      </animated.group>
    </>
  );
};

export default function InteractiveRope() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 40 }} style={{ pointerEvents: 'auto' }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#3b82f6" />
        <pointLight position={[0, -10, 5]} intensity={0.5} color="#8b5cf6" />
        
        <DraggableGraph initialX={-3.2} initialY={1.5} scale={0.22} barColor="#3b82f6" mass={1.5} tension={400} type="bar" bars={[1.5, 0.8, 2.2, 1.1]} />
        <DraggableGraph initialX={-1.5} initialY={-1.2} scale={0.26} barColor="#f7df1e" mass={3} tension={300} type="js" bars={[]} />
        <DraggableGraph initialX={0.2} initialY={1.0} scale={0.25} barColor="#f43f5e" mass={2} tension={350} type="horizontal" bars={[2.5, 1.2, 1.8]} />
        <DraggableGraph initialX={1.8} initialY={-0.6} scale={0.2} barColor="#eab308" mass={1.2} tension={450} type="round" bars={[]} />
        <DraggableGraph initialX={3.4} initialY={1.8} scale={0.28} barColor="#61dafb" mass={2.5} tension={320} type="react" bars={[]} />
      </Canvas>
    </div>
  );
}
