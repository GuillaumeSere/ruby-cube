import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'dat.gui';
import { gsap } from 'gsap';

function createCubie(size, colors) {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const materials = colors.map(c => new THREE.MeshBasicMaterial({ color: c }));
  const mesh = new THREE.Mesh(geometry, materials);
  return mesh;
}

function setCubieMaterialsByPos(mesh, pos, colorsMap) {
  // pos: [x,y,z] with values -1,0,1
  const facesColors = [0x000000,0x000000,0x000000,0x000000,0x000000,0x000000];
  const [x,y,z] = pos;
  if (x === 1) facesColors[0] = colorsMap.R; // +X right
  if (x === -1) facesColors[1] = colorsMap.L; // -X left
  if (y === 1) facesColors[2] = colorsMap.U; // +Y up
  if (y === -1) facesColors[3] = colorsMap.D; // -Y down
  if (z === 1) facesColors[4] = colorsMap.F; // +Z front
  if (z === -1) facesColors[5] = colorsMap.B; // -Z back

  // replace materials array to ensure correct colors
  mesh.material = facesColors.map(c => new THREE.MeshBasicMaterial({ color: c }));
}

function roundToGrid(v) {
  // round number close to -1,0,1
  if (Math.abs(v - 1) < 0.3) return 1;
  if (Math.abs(v + 1) < 0.3) return -1;
  return 0;
}

export function initRubiksApp(container) {
  // layout
  const controlsBar = document.createElement('div');
  controlsBar.className = 'controls';
  const scrambleBtn = document.createElement('button');
  scrambleBtn.className = 'btn';
  scrambleBtn.textContent = 'Scramble';
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn';
  resetBtn.textContent = 'Reset';
  controlsBar.appendChild(scrambleBtn);
  controlsBar.appendChild(resetBtn);

  // face controls
  const faces = ['U','D','F','B','L','R'];
  const faceMap = { U: 'Up', D: 'Down', F: 'Front', B: 'Back', L: 'Left', R: 'Right' };
  const faceControls = document.createElement('div');
  faceControls.style.display = 'flex';
  faceControls.style.gap = '6px';
  faceControls.style.flexWrap = 'wrap';
  faces.forEach(f => {
    const wrap = document.createElement('div');
    const label = document.createElement('div');
    label.style.fontSize = '12px';
    label.style.color = '#ddd';
    label.textContent = faceMap[f];
    const btnCW = document.createElement('button');
    btnCW.className = 'btn';
    btnCW.style.padding = '4px 8px';
    btnCW.textContent = f + ' ↻';
    const btnCCW = document.createElement('button');
    btnCCW.className = 'btn';
    btnCCW.style.padding = '4px 8px';
    btnCCW.textContent = f + ' ↺';
    wrap.appendChild(label);
    wrap.appendChild(btnCW);
    wrap.appendChild(btnCCW);
    faceControls.appendChild(wrap);
    btnCW.addEventListener('click', () => rotateFace(f, 1));
    btnCCW.addEventListener('click', () => rotateFace(f, -1));
  });
  controlsBar.appendChild(faceControls);

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'canvas-wrap';
  container.appendChild(controlsBar);
  container.appendChild(canvasWrap);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  const camera = new THREE.PerspectiveCamera(45, canvasWrap.clientWidth / canvasWrap.clientHeight, 0.1, 1000);
  camera.position.set(4, 4, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvasWrap.clientWidth, canvasWrap.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  canvasWrap.appendChild(renderer.domElement);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;

  // lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient);

  // cubies
  const cubies = [];
  const size = 0.95;
  const gap = 0.02;
  const colors = {
    U: 0xffff00, // up - yellow
    D: 0xffffff, // down - white
    F: 0xff0000, // front - red
    B: 0xffa500, // back - orange
    L: 0x0000ff, // left - blue
    R: 0x00ff00  // right - green
  };

  const parent = new THREE.Group();
  scene.add(parent);

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const facesColors = [0x000000,0x000000,0x000000,0x000000,0x000000,0x000000];
        // map faces: +X right, -X left, +Y up, -Y down, +Z front, -Z back
        if (x === 1) facesColors[0] = colors.R; // +X
        if (x === -1) facesColors[1] = colors.L; // -X
        if (y === 1) facesColors[2] = colors.U; // +Y
        if (y === -1) facesColors[3] = colors.D; // -Y
        if (z === 1) facesColors[4] = colors.F; // +Z
        if (z === -1) facesColors[5] = colors.B; // -Z

        const cubie = createCubie(size, facesColors);
        cubie.position.set(x * (size + gap), y * (size + gap), z * (size + gap));
        parent.add(cubie);
        // store initial position so reset can restore solved stickers
        cubies.push({ mesh: cubie, pos: [x,y,z], initialPos: [x,y,z] });
      }
    }
  }

  // basic resize handling
  function onResize() {
    const w = canvasWrap.clientWidth;
    const h = canvasWrap.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  let isRotating = false;

  function rotateFace(face, dir = 1) {
    if (isRotating) return;
    isRotating = true;
    // axis and coordinate
    const map = { U: ['y', 1], D: ['y', -1], F: ['z', 1], B: ['z', -1], R: ['x', 1], L: ['x', -1] };
    const [axis, coord] = map[face];

    // create rotation group
    const group = new THREE.Group();
    parent.add(group);

    // attach matching cubies to group (preserve world transform)
    const moving = [];
    cubies.forEach(c => {
      const v = c.pos;
      if ((axis === 'x' && v[0] === coord) || (axis === 'y' && v[1] === coord) || (axis === 'z' && v[2] === coord)) {
        group.attach(c.mesh);
        moving.push(c);
      }
    });

    // animate rotation
    const prop = { t: 0 };
    const sign = dir; // 1 => +90, -1 => -90
    const target = Math.PI / 2 * sign;
    gsap.to(group.rotation, { [axis]: group.rotation[axis] + target, duration: 0.4, ease: 'power2.inOut', onComplete: () => {
      // after rotation, reparent cubies back to parent and snap positions
      moving.forEach(c => {
        parent.attach(c.mesh);
        // compute new integer pos based on rotation
        let [x,y,z] = c.pos;
        let nx = x, ny = y, nz = z;
        if (axis === 'x') {
          // rotate around X: y,z -> [-z, y] for +90
          if (sign === 1) { ny = -z; nz = y; } else { ny = z; nz = -y; }
        } else if (axis === 'y') {
          // rotate around Y: x,z -> [z, -x] for +90
          if (sign === 1) { nx = z; nz = -x; } else { nx = -z; nz = x; }
        } else if (axis === 'z') {
          // rotate around Z: x,y -> [-y, x] for +90
          if (sign === 1) { nx = -y; ny = x; } else { nx = y; ny = -x; }
        }
        c.pos = [nx, ny, nz];
        // snap mesh position and rotation
        c.mesh.position.set(nx*(size+gap), ny*(size+gap), nz*(size+gap));
        // normalize rotation to multiples of PI/2
        c.mesh.rotation.x = Math.round(c.mesh.rotation.x / (Math.PI/2)) * (Math.PI/2);
        c.mesh.rotation.y = Math.round(c.mesh.rotation.y / (Math.PI/2)) * (Math.PI/2);
        c.mesh.rotation.z = Math.round(c.mesh.rotation.z / (Math.PI/2)) * (Math.PI/2);
      });
      // remove group
      parent.remove(group);
      isRotating = false;
    } });
  }

  // simple scramble animation rotates the parent randomly (keeps cubie positions)
  function scramble() {
    const tl = gsap.timeline();
    for (let i=0;i<12;i++) {
      const face = faces[Math.floor(Math.random()*faces.length)];
      const dir = Math.random()>.5?1:-1;
      // call rotateFace sequentially using timeline
      tl.call(() => rotateFace(face, dir));
      tl.to({}, { duration: 0.05 });
    }
  }

  function reset() {
    // reset parent orientation
    gsap.to(parent.rotation, { x:0, y:0, z:0, duration: 0.6, ease: 'power2.out' });
    // place cubies back according to their pos
    cubies.forEach(c => {
      // restore to initial solved position and orientation
      c.pos = c.initialPos.slice();
      c.mesh.position.set(c.pos[0]*(size+gap), c.pos[1]*(size+gap), c.pos[2]*(size+gap));
      c.mesh.rotation.set(0,0,0);
      // reset materials so outward faces show correct colors
      setCubieMaterialsByPos(c.mesh, c.pos, colors);
    });
  }

  scrambleBtn.addEventListener('click', scramble);
  resetBtn.addEventListener('click', reset);

  // basic GUI
  const gui = new GUI({ width: 260 });
  const state = { scramble, reset };
  gui.add(state, 'scramble');
  gui.add(state, 'reset');

  // render loop
  function animate() {
    requestAnimationFrame(animate);
    orbit.update();
    renderer.render(scene, camera);
  }
  animate();
}
