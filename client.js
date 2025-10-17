const socket = io();  // connect to server

let scene, camera, renderer;
let carModel;
const otherCars = {};  // map of remote players’ car meshes

function initThree() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("gameContainer").appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);

  // Ground / track placeholder (plane)
  const planeGeom = new THREE.PlaneGeometry(200, 200);
  const planeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const plane = new THREE.Mesh(planeGeom, planeMat);
  plane.rotation.x = - Math.PI / 2;
  scene.add(plane);
}

function loadCarModel(callback) {
  const loader = new THREE.GLTFLoader();
  loader.load('/assets/car.glb', gltf => {
    carModel = gltf.scene;
    callback();
  }, undefined, err => {
    console.error("Car load error:", err);
  });
}

function addCarForId(id, position) {
  if (otherCars[id]) return;
  const clone = carModel.clone();
  scene.add(clone);
  otherCars[id] = clone;
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function setupSocket() {
  socket.on('connect', () => {
    document.getElementById('myId').textContent = socket.id;
  });

  socket.on('stateUpdate', (players) => {
    // players is an object { id: { x, y, z, rotationY } }
    for (const [id, st] of Object.entries(players)) {
      if (id === socket.id) continue;
      addCarForId(id, st);
      const mesh = otherCars[id];
      mesh.position.set(st.x, st.y, st.z);
      mesh.rotation.y = st.rotationY;
    }
  });

  // sending our local state at intervals
  setInterval(() => {
    // For demo, we send a random position; in real you send actual car pos & rotation
    const yourState = {
      x: Math.random() * 10 - 5,
      y: 0,
      z: Math.random() * 10 - 5,
      rotationY: 0
    };
    socket.emit('updateState', yourState);
  }, 100);  // 10 times per second
}

function start() {
  initThree();
  loadCarModel(() => {
    animate();
    setupSocket();
  });
}

start();
