// 游戏状态
//使用 Three.js 构建的基于 WebGL 的 3D 游戏
const gameState = {
    player: null,
    enemies: [],
    score: 0,
    health: 10000000,
    isJumping: false,
    attackCooldown: 0,
    cameraDistance: 5,
    mouseX: 0,
    mouseY: 0,
    moveDirection: {
        forward: false,
        backward: false,
        left: false,
        right: false
    }
};

// 初始化场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.FogExp2(0x87CEEB, 0.05);

// 初始化相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

// 添加光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(100, 100, 50);
sunLight.castShadow = true;
scene.add(sunLight);

// 添加平面
const groundGeometry = new THREE.PlaneGeometry(100, 100, 100, 100);
const groundMaterial = new THREE.MeshStandardMaterial
({ 
    color: 0x228B22,
    wireframe: false 
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2;
ground.receiveShadow = true;

// 添加地形细节
for (let i = 0; i < 500; i++) {
    const rockGeometry = new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.3, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080 
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(
        (Math.random() - 0.5) * 100,
        -1.8,
        (Math.random() - 0.5) * 100
    );
    rock.castShadow = true;
    scene.add(rock);
}

scene.add(ground);

// 添加装饰（树）
for (let i = 0; i < 30; i++) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513 
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    
    const leavesGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x228B22 
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 1.5;
    
    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(leaves);
    
    tree.position.set(
        (Math.random() - 0.5) * 80,
        0,
        (Math.random() - 0.5) * 80
    );
    
    tree.castShadow = true;
    scene.add(tree);
}

// 初始化加载器
const loader = new THREE.GLTFLoader();

// 创建玩家
async function createPlayer() {


        // 创建默认玩家几何体

    const cube = new THREE.Group();

    // 创建身体（圆柱形）
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
    const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.y = 0.6;  // 将身体抬高到地面以上
    cube.add(body);

    // 创建头部（球形）
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const head = new THREE.Mesh(headGeometry, material);
    head.position.y = 1.4;  // 放置在身体顶部
    cube.add(head);

    // 创建腿部（两个小圆柱体）
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const legMaterial = material.clone();
    legMaterial.color.set(0x0000ff);

    // 左腿
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.9, 0);
    leftLeg.rotation.z = 0.1;  // 轻微外扩角度
    cube.add(leftLeg);

    // 右腿
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.9, 0);
    rightLeg.rotation.z = -0.1;  // 轻微外扩角度
    cube.add(rightLeg);

    // 创建手臂（两个小圆柱体）
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
    const armMaterial = material.clone();
    armMaterial.color.set(0x00ff00);

    // 左手臂
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 1, 0);
    leftArm.rotation.z = Math.PI / 2;  // 水平方向旋转
    cube.add(leftArm);

    // 右手臂
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 1, 0);
    rightArm.rotation.z = Math.PI / 2;  // 水平方向旋转
    cube.add(rightArm);

    // 最后将整个人组添加到场景中
scene.add(cube);
        
        return {
            model: cube,
            position: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            direction: new THREE.Vector3(0, 0, -1),
            attackRange: 7,//攻击范围
            speed: 0.2,
            jumpPower: 0.5,
            health: 100
    }
}

// 创建敌人
async function createEnemy(position) {
    const enemyGroup = new THREE.Group();

    // 敌人材质 - 使用红色调区别于玩家
    const enemyMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        shininess: 30
    });

    // 创建身体（圆柱形）
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
    const body = new THREE.Mesh(bodyGeometry, enemyMaterial);
    body.position.y = 0.6;
    enemyGroup.add(body);

    // 创建头部（球形）
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const head = new THREE.Mesh(headGeometry, enemyMaterial);
    head.position.y = 1.4;
    enemyGroup.add(head);

    // 创建腿部（两个小圆柱体）
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const legMaterial = enemyMaterial.clone();
    legMaterial.color.set(0x8B0000); // 深红色腿

    // 左腿
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.9, 0);
    leftLeg.rotation.z = 0.1;
    enemyGroup.add(leftLeg);

    // 右腿
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.9, 0);
    rightLeg.rotation.z = -0.1;
    enemyGroup.add(rightLeg);

    // 创建手臂（两个小圆柱体）
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
    const armMaterial = enemyMaterial.clone();
    armMaterial.color.set(0x8B0000); // 深红色手臂

    // 左手臂
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 1, 0);
    leftArm.rotation.z = Math.PI / 2;
    enemyGroup.add(leftArm);

    // 右手臂
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 1, 0);
    rightArm.rotation.z = Math.PI / 2;
    enemyGroup.add(rightArm);

    // 设置敌人位置并添加到场景
    enemyGroup.position.copy(position);
    scene.add(enemyGroup);

    return {
        model: enemyGroup,
        position: position.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        health: 30,
        damage: 10,
        speed: 0.05,
        isHit: false,
        hitTimer: 0
    };
}

//// 创建攻击效果
function createAttackEffect(position) {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
    });
    const effect = new THREE.Mesh(geometry, material);
    effect.position.copy(position);
    scene.add(effect);
    
    return {
        mesh: effect,
        scale: 1,
        alive: true
    };
}

//// 游戏初始化
async function initGame() {
    gameState.player = await createPlayer();
    
    // 创建初始敌人
    for (let i = 0; i < 5; i++) {
        const pos = new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            0,
            (Math.random() - 0.5) * 50
        );
        gameState.enemies.push(await createEnemy(pos));
    }
    
    // 初始化相机位置
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    
    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    
    // 开始游戏循环
    animate();
}

//// 事件处理函数
function handleKeyDown(event) {
    switch (event.key.toLowerCase()) {
        case 'w': gameState.moveDirection.forward = true; break;
        case 's': gameState.moveDirection.backward = true; break;
        case 'a': gameState.moveDirection.left = true; break;
        case 'd': gameState.moveDirection.right = true; break;
    }
}

function handleKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case 'w': gameState.moveDirection.forward = false; break;
        case 's': gameState.moveDirection.backward = false; break;
        case 'a': gameState.moveDirection.left = false; break;
        case 'd': gameState.moveDirection.right = false; break;
    }
}

function handleMouseDown(event) {
    if (event.button === 0) { // 左键
        attack();
    }
}

function handleMouseMove(event) {
    gameState.mouseX = event.clientX - window.innerWidth / 2;
    gameState.mouseY = event.clientY - window.innerHeight / 2;
}

//// 玩家攻击
function attack() {
    if (gameState.attackCooldown > 0) return;
    gameState.attackCooldown = 20; // 攻击冷却时间
    
    const attackPosition = new THREE.Vector3().copy(gameState.player.position);
    attackPosition.y += 1;
    
    // 检测攻击范围内的敌人
    for (const enemy of gameState.enemies) {
        const distance = enemy.position.distanceTo(gameState.player.position);
        if (distance < gameState.player.attackRange) {
            enemy.health -= 15;
            enemy.isHit = true;
            enemy.hitTimer = 10;
            
            if (enemy.health <= 0) {
                // 敌人死亡
                scene.remove(enemy.model);
                const index = gameState.enemies.indexOf(enemy);
                gameState.enemies.splice(index, 1);
                
                // 增加分数
                gameState.score += 10;
                document.getElementById('score').textContent = gameState.score;
                
                // 生成新敌人
                const pos = new THREE.Vector3(
                    (Math.random() - 0.5) * 50,
                    0,
                    (Math.random() - 0.5) * 50
                );
                createEnemy(pos).then(newEnemy => {
                    gameState.enemies.push(newEnemy);
                });
            }
        }
    }
    
    // 创建攻击效果
    const effect = createAttackEffect(attackPosition);
    gameState.effects = gameState.effects || [];
    gameState.effects.push(effect);
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 处理攻击冷却
    if (gameState.attackCooldown > 0) {
        gameState.attackCooldown--;
    }
    
    // 处理敌人
    for (const enemy of gameState.enemies) {
        // 简单AI：向玩家移动
        const direction = new THREE.Vector3().subVectors(gameState.player.position, enemy.position);
        direction.y = 0;
        direction.normalize().multiplyScalar(enemy.speed);
        
        enemy.position.add(direction);
        enemy.model.position.copy(enemy.position);
        
        // 敌人朝向玩家
        enemy.model.lookAt(
            gameState.player.position.x, 
            enemy.position.y, 
            gameState.player.position.z
        );
        
        // 碰撞检测
        const distance = enemy.position.distanceTo(gameState.player.position);
        if (distance < 2) {
            gameState.health -= enemy.damage * 0.01;
            document.getElementById('health-fill').style.width = `${gameState.health}%`;
            
            if (gameState.health <= 0) {
                alert("游戏结束！最终得分: " + gameState.score);
                document.location.reload();
            }
        }
        
        // 处理敌人被击中效果
        if (enemy.isHit) {
            if (enemy.hitTimer > 0) {
                enemy.model.position.y = enemy.position.y + Math.sin(enemy.hitTimer) * 0.5;
                enemy.hitTimer--;
            } else {
                enemy.isHit = false;
            }
        }
    }
    
    //// 处理攻击效果
    if (gameState.effects) {
        for (let i = gameState.effects.length - 1; i >= 0; i--) {
            const effect = gameState.effects[i];
            effect.scale *= 1.1;
            effect.mesh.scale.set(effect.scale, effect.scale, effect.scale);
            
            effect.mesh.material.opacity *= 0.9;
            
            if (effect.scale > 5) {
                scene.remove(effect.mesh);
                gameState.effects.splice(i, 1);
            }
        }
    }
    
    // 玩家移动
    let playerMovement = new THREE.Vector3(0, 0, 0);
    
    if (gameState.moveDirection.forward) playerMovement.z -= gameState.player.speed;
    if (gameState.moveDirection.backward) playerMovement.z += gameState.player.speed;
    if (gameState.moveDirection.left) playerMovement.x -= gameState.player.speed;
    if (gameState.moveDirection.right) playerMovement.x += gameState.player.speed;
    
    // 应用重力
    gameState.player.velocity.y -= 0.05;
    playerMovement.y = gameState.player.velocity.y;
    
    // 更新玩家位置
    gameState.player.position.add(playerMovement);
    gameState.player.model.position.copy(gameState.player.position);
    
// 地面碰撞检测
    const footHeight = -1.4;  // 玩家模型组中心到脚底的距离（向下的方向为负）
    const groundHeight = -2;  // 地面的y坐标

    if (gameState.player.position.y + footHeight < groundHeight) {
        gameState.player.position.y = groundHeight - footHeight;
        gameState.player.velocity.y = 0;  // 停止下落
        gameState.isJumping = false;
    }
    
    // 根据鼠标移动旋转玩家
    const rotationY = -gameState.mouseX * 0.005;
    gameState.player.model.rotation.y = rotationY;
    
    // 第三人称相机控制
    const targetCameraPos = new THREE.Vector3(
        gameState.player.position.x,
        gameState.player.position.y + 3,
        gameState.player.position.z + gameState.cameraDistance
    );
    
    // 简单的相机跟随
    camera.position.x = camera.position.x + (targetCameraPos.x - camera.position.x) * 0.1;
    camera.position.y = camera.position.y + (targetCameraPos.y - camera.position.y) * 0.1;
    camera.position.z = camera.position.z + (targetCameraPos.z - camera.position.z) * 0.1;
    
    camera.lookAt(
        gameState.player.position.x,
        gameState.player.position.y + 2,
        gameState.player.position.z
    );
    
    renderer.render(scene, camera);
}

// 窗口调整大小
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 启动游戏
initGame();