'use client';

// FurniturePlanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import SmartThingsCalculator from './SmartThingsCalculator';

const FurniturePlanner = () => {
  const mountRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('furniture');
  const [selectedItem, setSelectedItem] = useState(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera setup - adjust position for better view
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Renderer setup with proper sizing
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    
    // Set initial size to container size
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Clear any existing canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Update scene background
    scene.background = new THREE.Color(0x1a1a1a); // Darker background to match theme

    // Add post-processing setup after renderer setup
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Outline pass for selection highlight
    const outlinePass = new OutlinePass(
      new THREE.Vector2(800, 600),
      scene,
      camera
    );
    outlinePass.visibleEdgeColor.set('#ff0000');
    outlinePass.edgeStrength = 3;
    outlinePass.edgeGlow = 0;
    composer.addPass(outlinePass);

    // Enhanced Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Add a secondary light for better illumination
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Floor with improved material
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls with improved materials
    const createWalls = () => {
      const wallGroup = new THREE.Group();
      const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xeeeeee,
        roughness: 0.8,
        metalness: 0.1
      });
      
      // Back wall
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial
      );
      backWall.position.set(0, 5, -10);
      backWall.receiveShadow = true;
      wallGroup.add(backWall);

      // Side walls
      const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial.clone()
      );
      leftWall.position.set(-10, 5, 0);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.receiveShadow = true;
      wallGroup.add(leftWall);

      const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial.clone()
      );
      rightWall.position.set(10, 5, 0);
      rightWall.rotation.y = -Math.PI / 2;
      rightWall.receiveShadow = true;
      wallGroup.add(rightWall);

      return wallGroup;
    };

    scene.add(createWalls());

    // Furniture creation functions
    const createFurniture = {
      bed: () => {
        const group = new THREE.Group();
        
        // Bed base
        const baseGeometry = new THREE.BoxGeometry(2.5, 0.3, 3.5);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        group.add(base);

        // Mattress
        const mattressGeometry = new THREE.BoxGeometry(2.4, 0.3, 3.4);
        const mattressMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
        const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
        mattress.position.y = 0.45;
        group.add(mattress);

        // Headboard
        const headboardGeometry = new THREE.BoxGeometry(2.5, 1.2, 0.2);
        const headboard = new THREE.Mesh(headboardGeometry, baseMaterial);
        headboard.position.set(0, 0.9, -1.65);
        group.add(headboard);

        group.castShadow = true;
        group.position.y = group.scale.y * 0.5;
        return group;
      },

      sofa: () => {
        const group = new THREE.Group();

        // Base
        const baseGeometry = new THREE.BoxGeometry(3, 0.5, 1.2);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x404040 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.25;
        group.add(base);

        // Back
        const backGeometry = new THREE.BoxGeometry(3, 1.2, 0.3);
        const back = new THREE.Mesh(backGeometry, baseMaterial);
        back.position.set(0, 0.9, -0.45);
        group.add(back);

        // Arms
        const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 1.2);
        const leftArm = new THREE.Mesh(armGeometry, baseMaterial);
        leftArm.position.set(-1.35, 0.4, 0);
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, baseMaterial);
        rightArm.position.set(1.35, 0.4, 0);
        group.add(rightArm);

        group.castShadow = true;
        group.position.y = group.scale.y * 0.5;
        return group;
      },

      desk: () => {
        const group = new THREE.Group();

        // Desktop
        const topGeometry = new THREE.BoxGeometry(2, 0.1, 1);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 0.75;
        group.add(top);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.1);
        const legPositions = [
          [-0.9, 0.375, 0.4],
          [0.9, 0.375, 0.4],
          [-0.9, 0.375, -0.4],
          [0.9, 0.375, -0.4],
        ];

        legPositions.forEach(pos => {
          const leg = new THREE.Mesh(legGeometry, topMaterial);
          leg.position.set(...pos);
          group.add(leg);
        });

        group.castShadow = true;
        group.position.y = group.scale.y * 0.5;
        return group;
      },

      chair: () => {
        const group = new THREE.Group();

        // Seat
        const seatGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.5);
        const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 0.45;
        group.add(seat);

        // Back
        const backGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.1);
        const back = new THREE.Mesh(backGeometry, seatMaterial);
        back.position.set(0, 0.75, -0.2);
        group.add(back);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.05, 0.45, 0.05);
        const legPositions = [
          [-0.2, 0.225, 0.2],
          [0.2, 0.225, 0.2],
          [-0.2, 0.225, -0.2],
          [0.2, 0.225, -0.2],
        ];

        legPositions.forEach(pos => {
          const leg = new THREE.Mesh(legGeometry, seatMaterial);
          leg.position.set(...pos);
          group.add(leg);
        });

        group.castShadow = true;
        group.position.y = group.scale.y * 0.5;
        return group;
      },

      cupboard: () => {
        const group = new THREE.Group();

        // Main body
        const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        group.add(body);

        // Doors
        const doorGeometry = new THREE.BoxGeometry(0.7, 1.9, 0.05);
        const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x6b3510 });
        
        const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        leftDoor.position.set(-0.375, 1, 0.275);
        group.add(leftDoor);

        const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        rightDoor.position.set(0.375, 1, 0.275);
        group.add(rightDoor);

        group.castShadow = true;
        group.position.y = group.scale.y * 0.5;
        return group;
      },
    };

    const createAppliances = {
      washingMachine: () => {
        const group = new THREE.Group();

        // Main body
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.85, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.425;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Door (circular)
        const doorGeometry = new THREE.CircleGeometry(0.25, 32);
        const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 0.425, 0.301);
        door.castShadow = true;
        group.add(door);

        group.castShadow = true;
        group.position.y = group.scale.y * 0.5;
        return group;
      },

      tv: () => {
        const group = new THREE.Group();

        // Screen
        const screenGeometry = new THREE.BoxGeometry(1.6, 0.9, 0.1);
        const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.y = 1.2;
        group.add(screen);

        // Stand
        const standGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.3);
        const standMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const stand = new THREE.Mesh(standGeometry, standMaterial);
        stand.position.y = 0.2;
        group.add(stand);

        group.castShadow = true;
        group.position.y = group.scale.y * 0.5;
        return group;
      },

      ac: () => {
        const group = new THREE.Group();

        // AC unit
        const unitGeometry = new THREE.BoxGeometry(1, 0.3, 0.25);
        const unitMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const unit = new THREE.Mesh(unitGeometry, unitMaterial);
        unit.position.y = 2.35;
        group.add(unit);

        group.castShadow = true;
        group.position.y = group.scale.y * 0.5;
        return group;
      },

      fridge: () => {
        const group = new THREE.Group();

        // Main body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        group.add(body);

        // Door handles
        const handleGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        
        const upperHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        upperHandle.position.set(0.35, 1.2, 0.4);
        group.add(upperHandle);

        const lowerHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        lowerHandle.position.set(0.35, 0.6, 0.4);
        group.add(lowerHandle);

        group.castShadow = true;
        group.position.y = group.scale.y * 0.5;
        return group;
      },

      fan: () => {
        const group = new THREE.Group();

        // Motor housing
        const motorGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 32);
        const motorMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
        const motor = new THREE.Mesh(motorGeometry, motorMaterial);
        motor.position.y = 2.9; // Position near ceiling
        motor.castShadow = true;
        group.add(motor);

        // Rod
        const rodGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 16);
        const rod = new THREE.Mesh(rodGeometry, motorMaterial);
        rod.position.y = 2.65;
        rod.castShadow = true;
        group.add(rod);

        // Create blades
        const bladeGeometry = new THREE.BoxGeometry(0.8, 0.02, 0.15);
        const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

        // Add 4 blades
        for (let i = 0; i < 4; i++) {
          const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
          blade.position.y = 2.8;
          blade.rotation.y = (Math.PI / 2) * i;
          blade.castShadow = true;
          group.add(blade);
        }

        // Add light fixture
        const lightFixtureGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.1, 32);
        const lightFixtureMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
        const lightFixture = new THREE.Mesh(lightFixtureGeometry, lightFixtureMaterial);
        lightFixture.position.y = 2.55;
        lightFixture.castShadow = true;
        group.add(lightFixture);

        group.castShadow = true;
        group.position.y = group.scale.y * 0.5;
        return group;
      },
    };

    // Create initial objects
    const objects = new Map();
    let selectedObject = null;

    // Add mouse and raycaster setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;

    // Function to update outline - Move this before the mouse handlers
    const updateOutline = (object) => {
      if (object) {
        outlinePass.selectedObjects = [object];
      } else {
        outlinePass.selectedObjects = [];
      }
    };

    // Mouse event handlers
    const onMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging && selectedObject) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(floor);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          selectedObject.position.x = point.x;
          selectedObject.position.z = point.z;
          // Maintain the y position based on scale
          selectedObject.position.y = selectedObject.scale.y * 0.5;
        }
      }
    };

    const onMouseDown = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const selectableObjects = Array.from(objects.values());
      const intersects = raycaster.intersectObjects(selectableObjects, true);
      
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        // Find the top-level parent (group)
        let targetObject = clickedObject;
        while (targetObject.parent && !(objects.has(Array.from(objects.keys()).find(key => objects.get(key) === targetObject)))) {
          targetObject = targetObject.parent;
        }
        
        if (targetObject && objects.has(Array.from(objects.keys()).find(key => objects.get(key) === targetObject))) {
          isDragging = true;
          selectedObject = targetObject;
          updateOutline(targetObject);
        }
      } else {
        selectedObject = null;
        updateOutline(null);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);

    // Improve resize functionality
    const resizeSelected = (newScale) => {
      if (selectedObject) {
        const currentPosition = selectedObject.position.clone();
        
        // Update scale
        selectedObject.scale.set(newScale, newScale, newScale);
        
        // Adjust height based on new scale while maintaining x,z position
        selectedObject.position.set(
          currentPosition.x,
          newScale * 0.5, // Adjust height based on new scale
          currentPosition.z
        );

        // Update shadows
        selectedObject.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      }
    };

    // Modify addItem to handle both furniture and appliances consistently
    const addItem = (type, category) => {
      const creators = category === 'furniture' ? createFurniture : createAppliances;
      if (creators[type]) {
        const item = creators[type]();
        
        // Set initial scale
        item.scale.set(scale, scale, scale);
        
        // Set initial position with proper height
        item.position.set(
          Math.random() * 4 - 2, 
          scale * 0.5,  // Initial height based on scale
          Math.random() * 4 - 2
        );

        // Ensure all meshes cast and receive shadows
        item.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(item);
        objects.set(`${type}-${objects.size}`, item);
        
        // Select the newly added item
        selectedObject = item;
        updateOutline(item);
      }
    };

    // Add resize handles to objects
    const addResizeHandles = (object) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const handles = new THREE.Group();

      // Create resize handles at edges
      const handleGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const handleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

      // Create 8 handles at corners
      const positions = [
        [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
        [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]
      ];

      positions.forEach(([x, y, z]) => {
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(
          x * size.x / 2,
          y * size.y / 2,
          z * size.z / 2
        );
        handle.userData.isResizeHandle = true;
        handle.userData.handleType = 'corner';
        handles.add(handle);
      });

      object.add(handles);
      handles.visible = false;
      object.userData.resizeHandles = handles;
    };

    // Show/hide resize handles
    const toggleResizeHandles = (object, show) => {
      if (object && object.userData.resizeHandles) {
        object.userData.resizeHandles.visible = show;
      }
    };

    // Setup rotation controls
    const rotateSelected = (direction) => {
      if (selectedObject) {
        selectedObject.rotation.y += direction * Math.PI / 4;
      }
    };

    // Add OrbitControls after renderer setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Add smooth damping
    controls.dampingFactor = 0.05;
    controls.minDistance = 5; // Minimum zoom distance
    controls.maxDistance = 20; // Maximum zoom distance
    controls.maxPolarAngle = Math.PI / 2; // Prevent camera going below ground
    controls.target.set(0, 0, 0); // Look at center of room

    // Modify the animation loop to update controls
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Update controls in animation loop
      composer.render();
    };
    animate();

    // Expose functions to React component
    window.addItem = addItem;
    window.rotateSelected = rotateSelected;
    window.resizeSelected = resizeSelected;
    window.getSelectedObject = () => selectedObject;

    // Function to handle resize
    const handleResize = () => {
      if (!container) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      composer.setSize(width, height);
      outlinePass.setSize(width, height);
    };

    // Initial resize and event listeners
    handleResize();
    window.addEventListener('resize', handleResize);

    // Add resize observer
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      composer.dispose();
      renderer.dispose();
      delete window.addItem;
      delete window.rotateSelected;
      delete window.resizeSelected;
      delete window.getSelectedObject;
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      controls.dispose();
    };
  }, [scale]);

  // UI Controls
  const furnitureItems = ['bed', 'sofa', 'desk', 'chair', 'cupboard'];
  const applianceItems = ['washingMachine', 'tv', 'ac', 'fridge', 'fan'];

  const handleAddItem = (item) => {
    if (window.addItem) {
      window.addItem(item, selectedCategory);
    }
  };

  const handleRotate = (direction) => {
    if (window.rotateSelected) {
      window.rotateSelected(direction);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-900">
      {/* Left Sidebar - 1/4 width */}
      <div className="w-1/4 bg-gray-800 text-gray-100 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Controls</h2>
        
        {/* Category Selection */}
        <div className="mb-4">
          <div className="flex flex-col space-y-1">
            <button
              className={`px-4 py-2 rounded text-left ${
                selectedCategory === 'furniture'
                  ? 'bg-gray-700'
                  : 'bg-gray-900 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedCategory('furniture')}
            >
              Furniture
            </button>
            <button
              className={`px-4 py-2 rounded text-left ${
                selectedCategory === 'appliances'
                  ? 'bg-blue-600'
                  : 'bg-gray-900 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedCategory('appliances')}
            >
              Appliances
            </button>
          </div>
        </div>

        {/* Add Items Section */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Add Items</h3>
          <div className="flex flex-col space-y-1">
            {(selectedCategory === 'furniture' ? furnitureItems : applianceItems).map(
              (item) => (
                <button
                  key={item}
                  className="px-3 py-2 bg-gray-900 hover:bg-gray-700 rounded text-left"
                  onClick={() => handleAddItem(item)}
                >
                  Add {item.replace(/([A-Z])/g, ' $1').trim()}
                </button>
              )
            )}
          </div>
        </div>

        {/* Size Control */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Size</h3>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={scale}
            onChange={(e) => {
              const newScale = parseFloat(e.target.value);
              setScale(newScale);
              if (window.resizeSelected) {
                window.resizeSelected(newScale);
              }
            }}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>50%</span>
            <span>100%</span>
            <span>200%</span>
          </div>
        </div>

        {/* Rotation Controls */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Rotation</h3>
          <div className="flex flex-col space-y-1">
            <button
              className="px-4 py-2 bg-gray-900 hover:bg-gray-700 rounded text-left"
              onClick={() => handleRotate(-1)}
            >
              ⟲ Rotate Left
            </button>
            <button
              className="px-4 py-2 bg-gray-900 hover:bg-gray-700 rounded text-left"
              onClick={() => handleRotate(1)}
            >
              ⟳ Rotate Right
            </button>
          </div>
        </div>

        {/* Add Camera Controls Instructions */}
        <div className="mt-4 border-t border-gray-700 pt-4">
          <h3 className="text-sm font-medium mb-2">Camera Controls</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Left Click + Drag to rotate view</p>
            <p>• Right Click + Drag to pan</p>
            <p>• Scroll to zoom in/out</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex w-3/4">
        {/* Room Viewer Section - 2/3 of remaining space */}
        <div className="w-2/3 h-screen bg-gray-900">
          <h2 className="text-xl font-bold text-white p-4">
            Samsung ST Comfort+Savings Experience Planner
          </h2>
          <div 
            ref={mountRef} 
            className="w-full h-[calc(100vh-5rem)] bg-gray-900"
            style={{ 
              position: 'relative',
              minHeight: '400px'
            }}
          />
        </div>

        {/* SmartThings Calculator Section */}
        <div className="w-1/3 overflow-y-auto bg-gray-800 border-l border-gray-700">
          <SmartThingsCalculator />
        </div>
      </div>
    </div>
  );
};

export default FurniturePlanner;