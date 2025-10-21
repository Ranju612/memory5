const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let rows=10, cols=10, cellSize=canvas.width/cols;
let maze=[], player={x:0,y:0}, exit={x:cols-1,y:rows-1}, timeLeft=120, level=1;
let animBlocks=[];

const timerDisplay = document.getElementById('timerDisplay');

// Audio
const bgMusic = new Audio('bgMusic.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4;
bgMusic.play();

const levelUpSound = new Audio('levelup.mp3');
const wrongSound = new Audio('wrong.mp3');

function generateMaze(){
    maze=Array.from({length:rows},()=>Array.from({length:cols},()=>0));

    // Static walls
    for(let i=0;i<Math.floor(level*3);i++){
        let x=Math.floor(Math.random()*cols);
        let y=Math.floor(Math.random()*rows);
        if((x===0 && y===0) || (x===cols-1 && y===rows-1)) continue;
        maze[y][x]=1;
    }

    // Moving grey blocks
    animBlocks=[];
    let blockCount = Math.min(10+level*2, rows*cols/2);
    for(let i=0;i<blockCount;i++){
        let bx=Math.floor(Math.random()*cols);
        let by=Math.floor(Math.random()*rows);
        if(maze[by][bx]===0 && !(bx===0&&by===0) && !(bx===exit.x&&by===exit.y)){
            maze[by][bx]=2;
            animBlocks.push({x:bx, y:by, drawX:bx, drawY:by});
        }
    }

    player={x:0,y:0};
    timeLeft=120-level*5>30 ? 120-level*5 : 30;
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<rows;y++){
        for(let x=0;x<cols;x++){
            if(maze[y][x]===1) ctx.fillStyle='#999';
            else ctx.fillStyle='#fff';
            ctx.fillRect(x*cellSize,y*cellSize,cellSize-2,cellSize-2);
        }
    }

    ctx.fillStyle='#777';
    animBlocks.forEach(b=>{
        b.drawX += (b.x - b.drawX)*0.2;
        b.drawY += (b.y - b.drawY)*0.2;
        ctx.fillRect(b.drawX*cellSize,b.drawY*cellSize,cellSize-2,cellSize-2);
    });

    // Player = yellow coin
    ctx.fillStyle='gold';
    ctx.beginPath();
    ctx.arc(player.x*cellSize+cellSize/2,player.y*cellSize+cellSize/2,cellSize/3,0,Math.PI*2);
    ctx.fill();

    // Exit = green box
    ctx.fillStyle='lime';
    ctx.fillRect(exit.x*cellSize,exit.y*cellSize,cellSize-2,cellSize-2);

    timerDisplay.innerText=`Time Left: ${timeLeft}s  |  Level: ${level}`;
}

function canMoveBlock(b, dx, dy){
    const nx=b.x+dx, ny=b.y+dy;
    if(nx<0||nx>=cols||ny<0||ny>=rows) return false;
    if(maze[ny][nx]===1) return false;
    if(animBlocks.some(bl=>bl!==b && bl.x===nx && bl.y===ny)) return false;
    if(player.x===nx && player.y===ny) return false;
    return true;
}

function movePlayer(dx,dy){
    const nx=player.x+dx, ny=player.y+dy;
    if(nx<0||nx>=cols||ny<0||ny>=rows) { wrongSound.play(); return; }
    if(maze[ny][nx]===1) { wrongSound.play(); return; }

    if(maze[ny][nx]===2){
        let block=animBlocks.find(b=>b.x===nx && b.y===ny);
        if(block && canMoveBlock(block, dx, dy)){
            maze[block.y][block.x]=0;
            block.x+=dx; block.y+=dy;
            maze[block.y][block.x]=2;
            player={x:nx, y:ny};
        } else { wrongSound.play(); return; }
    } else player={x:nx, y:ny};

    draw();
    checkExit();
}

// Controls
document.addEventListener('keydown',e=>{
    if(e.key==='ArrowUp') movePlayer(0,-1);
    if(e.key==='ArrowDown') movePlayer(0,1);
    if(e.key==='ArrowLeft') movePlayer(-1,0);
    if(e.key==='ArrowRight') movePlayer(1,0);
});

document.querySelectorAll('.mobile-controls button').forEach(btn=>{
    btn.addEventListener('click',()=>{
        const dir=btn.dataset.dir;
        if(dir==='up') movePlayer(0,-1);
        if(dir==='down') movePlayer(0,1);
        if(dir==='left') movePlayer(-1,0);
        if(dir==='right') movePlayer(1,0);
    });
});

// Auto move grey blocks every 2s, faster with levels
setInterval(()=>{
    animBlocks.forEach(b=>{
        let dirs=[[0,-1],[0,1],[-1,0],[1,0]].sort(()=>Math.random()-0.5);
        for(let [dx,dy] of dirs){
            if(canMoveBlock(b,dx,dy)){
                maze[b.y][b.x]=0;
                b.x+=dx; b.y+=dy;
                maze[b.y][b.x]=2;
                break;
            }
        }
    });
}, 2000 - level*100 > 500 ? 2000 - level*100 : 500);

// Check exit
function checkExit(){
    if(player.x===exit.x && player.y===exit.y){
        levelUpSound.play();
        alert('Level Up!');
        level++;
        generateMaze();
        draw();
    }
}

// Timer
setInterval(()=>{
    timeLeft--;
    if(timeLeft<=0){
        alert('Time Up!');
        generateMaze();
    }
    draw();
},1000);

function gameLoop(){ draw(); requestAnimationFrame(gameLoop); }
generateMaze();
gameLoop();
