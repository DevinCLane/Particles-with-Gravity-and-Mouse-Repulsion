/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
console.log(ctx);

// clear the canvas button
const clearBtn = document.getElementById("clearBtn");
clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particleArray.length = 0;
});

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
initCanvas();

window.addEventListener("resize", initCanvas());

canvas.addEventListener("click", ({ x, y }) => {
    mouse.x = x;
    mouse.y = y;
    initParticles(20);
});

canvas.addEventListener("mousemove", ({ x, y }) => {
    mouse.x = x;
    mouse.y = y;
});

/* 

mobile event listeners

*/
let touchStartTime,
    touchHoldDuration = 1000,
    isTouchHold = false;

canvas.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;

    // record the start time of the touch
    touchStartTime = Date.now();

    // detect if this is a touch hold (we're not going to make particles if the user is holding down on their touch screen)
    setTimeout(() => {
        // if the touch continues after the time out, it's a touch hold
        if (event.touches.length > 0) {
            isTouchHold = true;
        }
    }, touchHoldDuration);

    // prevent default behavior to avoid unwanted interactions
    event.preventDefault();
});

canvas.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;

    event.preventDefault();
});

canvas.addEventListener("touchend", () => {
    // if the touch duration is less than the threshold, create particles
    if (!isTouchHold && Date.now() - touchStartTime < touchHoldDuration) {
        initParticles(20);
    }

    // reset the isTouchHold flag
    isTouchHold = false;
});

const mouse = {
    x: undefined,
    y: undefined,
};

const particleArray = [];

class Particle {
    constructor() {
        this.x = mouse.x;
        this.y = mouse.y;
        this.size = getRandomFloat(2, 60);
        this.speedX = getRandomFloat(-1, 1);
        this.speedY = getRandomFloat(-1, 1);
        this.repulsionForce = 0.2;
        this.gravity = 0.1;
        this.damping = 0.998;
    }

    calculateRepulsionForceDirection() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.hypot(dx, dy);

        // make sure we don't divide by 0
        const directionX = distance !== 0 ? dx / distance : 0;
        const directionY = distance !== 0 ? dy / distance : 0;

        return { directionX, directionY, distance };
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // gravity
        this.speedY += this.gravity;

        // collision detection
        if (this.x + this.size > canvas.width || this.x - this.size <= 0) {
            this.speedX *= -1;

            // ensure particle is within the canvas after bouncing
            this.x =
                this.x + this.size > canvas.width
                    ? canvas.width - this.size
                    : this.size;
        }

        if (this.y + this.size > canvas.height || this.y - this.size <= 0) {
            this.speedY *= -1;

            // ensure particle is within canvas after bouncing
            this.y =
                this.y + this.size > canvas.height
                    ? canvas.height - this.size
                    : this.size;
        }

        // shrink particles if they're above a certain size
        if (this.size > 0.2) this.size -= 0.04;

        // repulsion force
        const { directionX, directionY, distance } =
            this.calculateRepulsionForceDirection();

        if (distance < 20) {
            this.speedX -= directionX * this.repulsionForce;
            this.speedY -= directionY * this.repulsionForce;
        }

        // dampening factor
        this.speedX *= this.damping;
        this.speedY *= this.damping;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function initParticles(n) {
    for (let i = 0; i < n; i++) {
        particleArray.push(new Particle());
    }
}

function handleParticles() {
    for (let i = 0; i < particleArray.length; i++) {
        particleArray[i].update();
        particleArray[i].draw();

        // dampening factor
        particleArray[i].speedX *= particleArray[i].damping;
        particleArray[i].speedY *= particleArray[i].damping;

        // repulsion force updates
        const { directionX, directionY } =
            particleArray[i].calculateRepulsionForceDirection();
        const distanceToMouse = Math.hypot(directionX, directionY);

        if (distanceToMouse < 20) {
            particleArray[i].speedX -=
                directionX * particleArray[i].repulsionForce;
            particleArray[i].speedY -=
                directionY * particleArray[i].repulsionForce;
        }

        for (let j = i + 1; j < particleArray.length; j++) {
            const dx = particleArray[i].x - particleArray[j].x;
            const dy = particleArray[i].y - particleArray[j].y;
            const distance = Math.hypot(dx, dy);

            if (distance < 150) {
                ctx.beginPath();
                ctx.moveTo(particleArray[i].x, particleArray[i].y);
                ctx.lineTo(particleArray[j].x, particleArray[j].y);
                ctx.stroke();
            }
        }

        if (particleArray[i].size <= 0.2) {
            particleArray.splice(i, 1);
            i--;
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleParticles();
    requestAnimationFrame(animate);
}
animate();
