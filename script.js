const drawingCanvas = document.getElementById('drawingCanvas');
const ctx = drawingCanvas.getContext('2d');
const templateImage = document.getElementById('templateImage');
const canvasContainer = document.getElementById('canvasContainer');

const penColorInput = document.getElementById('penColor');
const penThicknessInput = document.getElementById('penThickness');
const thicknessValueSpan = document.getElementById('thicknessValue');
const penToolBtn = document.getElementById('penToolBtn');
const eraserToolBtn = document.getElementById('eraserToolBtn');

const resetDrawingBtn = document.getElementById('resetDrawingBtn');
const resetIconsBtn = document.getElementById('resetIconsBtn');
const resetAllBtn = document.getElementById('resetAllBtn');

const stickerTray = document.getElementById('stickerTray');
const attackerStickersContainer = document.getElementById('attackerStickersContainer');
const defenderStickersContainer = document.getElementById('defenderStickersContainer');
const attackerGadgetsContainer = document.getElementById('attackerGadgetsContainer');
const defenderGadgetsContainer = document.getElementById('defenderGadgetsContainer');

const imageUploadInput = document.getElementById('imageUpload');
const templateSelect = document.getElementById('templateSelect');
const infoMessageBox = document.getElementById('infoMessageBox');

const confirmationModal = document.getElementById('confirmationModal');
const confirmationMessage = document.getElementById('confirmationMessage');
const confirmYesBtn = document.getElementById('confirmYes');
const confirmNoBtn = document.getElementById('confirmNo');

let isDrawing = false;
let isErasing = false;
let lastX = 0;
let lastY = 0;
let currentPenColor = penColorInput.value;
let currentPenThickness = parseInt(penThicknessInput.value);

let droppedStickers = []; // Array to store dropped sticker elements for reset

// Variable to store the function to execute after confirmation
let pendingResetAction = null;

// --- Utility Functions ---

/**
 * Displays a temporary info message to the user.
 * @param {string} message - The message to display.
 * @param {number} duration - How long to display the message in milliseconds.
 */
function showInfoMessage(message, duration = 500) {
    infoMessageBox.textContent = message;
    infoMessageBox.style.display = 'block';
    setTimeout(() => {
        infoMessageBox.style.display = 'none';
    }, duration);
}

/**
 * Shows a confirmation modal.
 * @param {string} message - The message to display in the modal.
 * @param {function} onConfirm - Callback function to execute if user confirms.
 */
function showConfirmation(message, onConfirm) {
    confirmationMessage.textContent = message;
    pendingResetAction = onConfirm; // Store the action to be performed
    confirmationModal.style.display = 'flex'; // Show the modal
}

// --- Canvas Sizing and Resizing ---

/**
 * Adjusts the canvas size to match its container.
 * This is crucial for responsiveness and correct drawing.
 */
function resizeCanvas() {
    const containerWidth = canvasContainer.offsetWidth;
    const containerHeight = canvasContainer.offsetHeight;

    drawingCanvas.width = containerWidth;
    drawingCanvas.height = containerHeight;

    // When resizing, we lose the drawing content.
    // If we had a complex drawing history, we'd redraw it here.
    // For this simple app, we'll clear it on resize.
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    // Reapply drawing settings
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

// Initial canvas resize and add event listener for window resize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas); // Ensure canvas is correctly sized on load

// --- Drawing Functionality ---

/**
 * Starts the drawing/erasing operation.
 * @param {MouseEvent} e - The mouse event.
 */
function startDrawing(e) {
    // Get mouse coordinates relative to the canvas
    const rect = drawingCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;

    // Check if the event target is the canvas itself or a sticker
    if (e.target !== drawingCanvas) {
        isDrawing = false; // Prevent drawing if clicking on a sticker
        return;
    }

    isDrawing = true;
    ctx.lineWidth = currentPenThickness;

    // Apply drawing/erasing mode
    if (isErasing) {
        // Eraser mode: clear content
        ctx.globalCompositeOperation = 'destination-out'; // This makes new drawing operations transparent
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // Color doesn't matter for destination-out
        ctx.lineWidth *= 8;
    } else {
        // Pen mode: draw with current color
        ctx.globalCompositeOperation = 'source-over'; // Default drawing mode
        ctx.strokeStyle = currentPenColor;
    }

    // Start a new path for drawing
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
}

/**
 * Continues the drawing/erasing operation.
 * @param {MouseEvent} e - The mouse event.
 */
function draw(e) {
    if (!isDrawing) return;

    const rect = drawingCanvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // For smoother lines, move to the current position after drawing
    lastX = currentX;
    lastY = currentY;
}

/**
 * Ends the drawing/erasing operation.
 */
function stopDrawing() {
    isDrawing = false;
    // Always reset globalCompositeOperation after drawing to avoid affecting subsequent operations
    ctx.globalCompositeOperation = 'source-over';
}

// Add drawing event listeners to the drawing canvas
drawingCanvas.addEventListener('mousedown', startDrawing);
drawingCanvas.addEventListener('mousemove', draw);
drawingCanvas.addEventListener('mouseup', stopDrawing);
drawingCanvas.addEventListener('mouseout', stopDrawing); // Stop drawing if mouse leaves canvas

// Handle touch events for drawing
drawingCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    startDrawing({ clientX: touch.clientX, clientY: touch.clientY, target: drawingCanvas });
}, { passive: false });

drawingCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    draw({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: false });

drawingCanvas.addEventListener('touchend', stopDrawing);
drawingCanvas.addEventListener('touchcancel', stopDrawing);

// --- Tool Controls ---

penColorInput.addEventListener('input', (e) => {
    currentPenColor = e.target.value;
    // Ensure pen mode is active when color is changed
    isErasing = false;
    penToolBtn.classList.add('bg-green-600');
    eraserToolBtn.classList.remove('bg-yellow-600');
    // showInfoMessage('Pen color changed!');
});

penThicknessInput.addEventListener('input', (e) => {
    currentPenThickness = parseInt(e.target.value);
    thicknessValueSpan.textContent = `${currentPenThickness}px`;
    // showInfoMessage(`Pen thickness: ${currentPenThickness}px`);
});

penToolBtn.addEventListener('click', () => {
    isErasing = false;
    penToolBtn.classList.add('bg-green-600');
    eraserToolBtn.classList.remove('bg-yellow-600');
    showInfoMessage('Pen tool selected.');
});

eraserToolBtn.addEventListener('click', () => {
    isErasing = true;
    eraserToolBtn.classList.add('bg-yellow-600');
    penToolBtn.classList.remove('bg-green-600');
    showInfoMessage('Eraser tool selected.');
});

// Initialize tool button states
penToolBtn.classList.add('bg-green-600'); // Pen is default

// --- Reset Functions ---

// Modified reset button handlers to include confirmation
resetDrawingBtn.addEventListener('click', () => {
    showConfirmation('Are you sure you want to reset your drawing?', () => {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        showInfoMessage('Drawing cleared!');
    });
});

resetIconsBtn.addEventListener('click', () => {
    showConfirmation('Are you sure you want to remove all icons?', () => {
        droppedStickers.forEach(sticker => sticker.remove());
        droppedStickers = []; // Clear the array
        showInfoMessage('All icons removed!');
    });
});

resetAllBtn.addEventListener('click', () => {
    showConfirmation('Are you sure you want to reset everything (drawing and icons)?', () => {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        droppedStickers.forEach(sticker => sticker.remove());
        droppedStickers = [];
        showInfoMessage('All cleared: drawing and icons removed!');
    });
});

// Confirmation modal button event listeners
confirmYesBtn.addEventListener('click', () => {
    if (pendingResetAction) {
        pendingResetAction(); // Execute the stored action
    }
    confirmationModal.style.display = 'none'; // Hide the modal
    pendingResetAction = null; // Clear the stored action
});

confirmNoBtn.addEventListener('click', () => {
    confirmationModal.style.display = 'none'; // Hide the modal
    pendingResetAction = null; // Clear the stored action
    showInfoMessage('Reset cancelled.');
});


// --- Sticker Drag and Drop ---

let draggedStickerOriginal = null; // Represents the sticker being dragged from the tray

const DEFAULT_SIZE = 35; // Size for all stickers
const OPERATOR_DROPPED_SIZE = 40; // Larger size for dropped operators

// Sticker data with categories for Attacker, Defender, Attacker Gadgets, Defender Gadgets
const stickerTemplates = [
    // Attacker Operators
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/striker.png', alt: 'Striker', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/sledge.png', alt: 'Sledge', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/thatcher.png', alt: 'Thatcher', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/ash.png', alt: 'Ash', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/thermite.png', alt: 'Thermite', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/twitch.png', alt: 'Twitch', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/montagne.png', alt: 'Montagne', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/glaz.png', alt: 'Glaz', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/fuze.png', alt: 'Fuze', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/blitz.png', alt: 'Blitz', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/iq.png', alt: 'IQ', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/buck.png', alt: 'Buck', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/blackbeard.png', alt: 'Blackbeard', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/capitao.png', alt: 'Capitao', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/hibana.png', alt: 'Hibana', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/jackal.png', alt: 'Jackal', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/ying.png', alt: 'Ying', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/zofia.png', alt: 'Zofia', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/dokkaebi.png', alt: 'Dokkaebi', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/lion.png', alt: 'Lion', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/finka.png', alt: 'Finka', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/maverick.png', alt: 'Maverick', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/nomad.png', alt: 'Nomad', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/gridlock.png', alt: 'Gridlock', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/nokk.png', alt: 'Nokk', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/amaru.png', alt: 'Amaru', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/kali.png', alt: 'Kali', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/iana.png', alt: 'Iana', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/ace.png', alt: 'Ace', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/zero.png', alt: 'Zero', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/flores.png', alt: 'Flores', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/osa.png', alt: 'Osa', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/sens.png', alt: 'Sens', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/grim.png', alt: 'Grim', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/brava.png', alt: 'Brava', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/ram.png', alt: 'Ram', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/deimos.png', alt: 'Deimos', category: 'attacker' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/rauora.png', alt: 'Rauora', category: 'attacker' },
    // Defender Operators
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/sentry.png', alt: 'Sentry', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/smoke.png', alt: 'Smoke', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/mute.png', alt: 'Mute', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/castle.png', alt: 'Castle', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/pulse.png', alt: 'Pulse', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/doc.png', alt: 'Doc', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/rook.png', alt: 'Rook', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/kapkan.png', alt: 'Kapkan', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/tachanka.png', alt: 'Tachanka', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/jager.png', alt: 'Jager', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/bandit.png', alt: 'Bandit', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/frost.png', alt: 'Frost', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/valkyrie.png', alt: 'Valkyrie', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/caveira.png', alt: 'Caveira', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/echo.png', alt: 'Echo', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/mira.png', alt: 'Mira', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/lesion.png', alt: 'Lesion', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/ela.png', alt: 'Ela', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/vigil.png', alt: 'Vigil', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/maestro.png', alt: 'Maestro', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/alibi.png', alt: 'Alibi', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/clash.png', alt: 'Clash', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/kaid.png', alt: 'Kaid', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/mozzie.png', alt: 'Mozzie', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/warden.png', alt: 'Warden', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/goyo.png', alt: 'Goyo', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/wamai.png', alt: 'Wamai', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/oryx.png', alt: 'Oryx', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/melusi.png', alt: 'Melusi', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/aruni.png', alt: 'Aruni', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/thunderbird.png', alt: 'Thunderbird', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/thorn.png', alt: 'Thorn', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/azami.png', alt: 'Azami', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/solis.png', alt: 'Solis', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/fenrir.png', alt: 'Fenrir', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/tubarao.png', alt: 'Tubarao', category: 'defender' },
    { type: 'image', url: 'https://r6operators.marcopixel.eu/icons/png/skopos.png', alt: 'Skopos', category: 'defender' },
    // Attacker Gadgets
    { type: 'image', url: './img/gadget/Drone.webp', alt: 'Drone', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/HardBreach.webp', alt: 'Hard Breach', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/Rotation.webp', alt: 'Rotation', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/Defuser.webp', alt: 'Defuser', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/BreachCharge.webp', alt: 'Breach Charge', category: 'attacker_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/4T4H5EJgUxorucGVtU2pkm/74fef324b89c220ce6426e8097f915b9/Claymore.png', alt: 'Claymore', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/FragGrenade.webp', alt: 'Frag Grenade', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/HardBreachCharge.webp', alt: 'Hard Breach Charge', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/Smoke.webp', alt: 'Smoke', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/StunGrenade.webp', alt: 'Stun Grenade', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/EMP.webp', alt: 'EMP', category: 'attacker_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/0114WqhzsMsnvaKc4FypkN/5ebb9b86e216a2d9e6b2ea01eb3346e8/Breaching-Rounds.png', alt: 'Breaching Rounds', category: 'attacker_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/3YaoPPUbFYeVSCemdj57EL/a4a4a8c0a935640f7d9a1d1ea82bc48c/Cluster-Charge.png', alt: 'Cluster Charge', category: 'attacker_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/5ur3NZUGos3i2HR8f0HIzj/46cf23c97453ebfedeaa42a1088ff32f/Tactical-Crossbow.png', alt: 'Tactical Crossbow', category: 'attacker_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/1elqIEWJ6XsXKAbMNd0Cai/0b4c0591bad284d957e652cdae0b706b/KS79-Lifeline.png', alt: 'Lifeline', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/Nomad.webp', alt: 'Nomad', category: 'attacker_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/QGVvmZeZ91FC2X4mvMzgn/601fa45e635872aea31f15ffebb9c366/Trax-Stingers.png', alt: 'Trax Stingers', category: 'attacker_gadget' },
    { type: 'image', url: './img/gadget/Zero.webp', alt: 'Zero', category: 'attacker_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/1z7eSI5D8IRIOHi0PJu4yq/3c4a273098a840957a248583f73fa8ff/r6s-operator-ability-flores.png', alt: 'Flores', category: 'attacker_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/71VBmyDtBAx788WnNJfEgo/1e6d78a81f8dc381bf4244b87970038f/r6s-operator-ability-osa.png', alt: 'Osa', category: 'attacker_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/16gy72yx3AMn6pNE6HJm11/096d33d454536a2da6e5f26bae01d9ff/r6s-operator-ability-rauora.png', alt: 'Rauora', category: 'attacker_gadget' },
    // Defender Gadgets
    { type: 'image', url: './img/gadget/Rotation.webp', alt: 'Rotation', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Reinforcement.webp', alt: 'Reinforcement', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Barricade.webp', alt: 'Barricade', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Barb.webp', alt: 'Barbed Wire', category: 'defender_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/gZuOXvuTu2i8hQX0B6auy/259f379a6283bae618443d722a896f1a/Bulletproof_camera.png', alt: 'Bulletproof Camera', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Shield.webp', alt: 'Shield', category: 'defender_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/5toUEasFf4nw1vID6N8fpC/6d4abf9f8937dcfbf8b0837ec7940477/r6s-observationblocker-gadget.png', alt: 'Observation Blocker', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/ImpactGrenade.webp', alt: 'Impact Grenade', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/NitroCell.webp', alt: 'Nitro Cell', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/ProximityMine.webp', alt: 'Proximity Mine', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/ToxicBabe.webp', alt: 'Toxic Babe', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Mute.webp', alt: 'Mute', category: 'defender_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/29N9nMqB8ZZxGCPz128ccD/439cb1fcb2f6d5385378cf073a5fbc30/Armor-Panel.png', alt: 'Armor Panel', category: 'defender_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/FLgwGbMiZTrWcK62KxPq8/d4e584420f85fa61c09e5e57e12d9dd9/Entry-Denial-Device.png', alt: 'Entry Denial Device', category: 'defender_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/37wX75QnY7XA6KbjM4aF5n/0ab116d398cf71463e11d43913818ec1/Shumikha-Launcher.png', alt: 'Shumikha Launcher', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Jager.webp', alt: 'Jager', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Bandit.webp', alt: 'Bandit', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Frost.webp', alt: 'Frost', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Valkyrie.webp', alt: 'Valkyrie', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Echo.webp', alt: 'Echo', category: 'defender_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/1a1w8epOhWE8VtzvvCJG9d/b20cbb221f7d45e5838f839ce042f409/Black-mirror.png', alt: 'Black Mirror', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Lesion.webp', alt: 'Lesion', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Ela.webp', alt: 'Ela', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Maestro.webp', alt: 'Maestro', category: 'defender_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/7sJYir66zAPq2omSvYeT2u/8fbe3370d32fb5433fb6d3a86d46a1b9/Prisma.png', alt: 'Prisma', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Kaid.webp', alt: 'Kaid', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Mozzie.webp', alt: 'Mozzie', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Goyo.webp', alt: 'Goyo', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Wamai.webp', alt: 'Wamai', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/MelusiBanshee.webp', alt: 'Melusi Banshee', category: 'defender_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/4hLJAAVKrf50wosG0471od/cde1867daf863c03754969f159ac00de/r6s-operator-ability-aruni.png', alt: 'Aruni', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Thunderbird.webp', alt: 'Thunderbird', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Thorn.webp', alt: 'Thorn', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Azami.webp', alt: 'Azami', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Fenrir.webp', alt: 'Fenrir', category: 'defender_gadget' },
    { type: 'image', url: './img/gadget/Tubarao.webp', alt: 'Tubarao', category: 'defender_gadget' },
    { type: 'image', url: 'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/56v8dxuabTfIHtPSmQX7AJ/9079454089effc91c685d7e759728797/r6s-operator-ability-skopos.png', alt: 'Skopos', category: 'defender_gadget' }
];

function populateStickerTray() {
    // Clear existing stickers from all containers
    attackerStickersContainer.innerHTML = '';
    defenderStickersContainer.innerHTML = '';
    attackerGadgetsContainer.innerHTML = '';
    defenderGadgetsContainer.innerHTML = '';

    stickerTemplates.forEach(stickerData => {
        const stickerDiv = document.createElement('div');
        stickerDiv.classList.add('sticker-item', 'flex', 'items-center', 'justify-center', 'text-sm', 'font-bold');
        stickerDiv.setAttribute('draggable', 'true');

        let currentDroppedSize;

        // Determine sizes based on category
        if (stickerData.category === 'attacker' || stickerData.category === 'defender') {
            currentDroppedSize = OPERATOR_DROPPED_SIZE;
        }

        // Set initial size
        stickerDiv.style.width = `${DEFAULT_SIZE}px`;
        stickerDiv.style.height = `${DEFAULT_SIZE}px`;
        stickerDiv.dataset.droppedSize = currentDroppedSize; // Store dropped size for later use
        stickerDiv.dataset.stickerType = 'image';
        stickerDiv.style.backgroundImage = `url('${stickerData.url}')`;
        stickerDiv.dataset.imageUrl = stickerData.url;
        stickerDiv.dataset.stickerSource = 'tray'; // Identify as original from tray

        stickerDiv.addEventListener('dragstart', (e) => {
            draggedStickerOriginal = stickerDiv;
            e.dataTransfer.setData('text/plain', stickerDiv.dataset.stickerType); // Set data for drag
            e.dataTransfer.setDragImage(stickerDiv, DEFAULT_SIZE / 2, DEFAULT_SIZE / 2); // Center drag image
        });

        // Append to the correct category container
        switch (stickerData.category) {
            case 'attacker':
                attackerStickersContainer.appendChild(stickerDiv);
                break;
            case 'defender':
                defenderStickersContainer.appendChild(stickerDiv);
                break;
            case 'attacker_gadget':
                attackerGadgetsContainer.appendChild(stickerDiv);
                break;
            case 'defender_gadget':
                defenderGadgetsContainer.appendChild(stickerDiv);
                break;
            default:
                // Fallback for any stickers without a specified category
                attackerStickersContainer.appendChild(stickerDiv);
        }
    });
}
populateStickerTray(); // Initial population of stickers

// Allow stickers to be repositioned and deleted after being dropped
function makeStickerDraggable(stickerElement) {
    let isDraggingSticker = false;
    let offsetX, offsetY;

    // Mouse events for dragging
    stickerElement.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('dropped-sticker')) {
            isDraggingSticker = true;
            // Calculate offset from mouse to top-left of sticker
            const rect = stickerElement.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            stickerElement.style.cursor = 'grabbing';
        }
    });

    canvasContainer.addEventListener('mousemove', (e) => {
        if (isDraggingSticker) {
            // Get container's position to calculate relative position
            const containerRect = canvasContainer.getBoundingClientRect();
            const newX = e.clientX - containerRect.left - offsetX;
            const newY = e.clientY - containerRect.top - offsetY;

            // Constrain sticker within canvas container bounds
            const maxX = containerRect.width - stickerElement.offsetWidth;
            const maxY = containerRect.height - stickerElement.offsetHeight;

            stickerElement.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            stickerElement.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        }
    });

    canvasContainer.addEventListener('mouseup', () => {
        if (isDraggingSticker) {
            isDraggingSticker = false;
            stickerElement.style.cursor = 'grab';
        }
    });

    // Touch events for dropped stickers
    stickerElement.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('dropped-sticker')) {
            e.preventDefault(); // Prevent scrolling
            isDraggingSticker = true;
            const touch = e.touches[0];
            const rect = stickerElement.getBoundingClientRect();
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
            stickerElement.style.cursor = 'grabbing';
        }
    }, { passive: false });

    canvasContainer.addEventListener('touchmove', (e) => {
        if (isDraggingSticker) {
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            const containerRect = canvasContainer.getBoundingClientRect();
            const newX = touch.clientX - containerRect.left - offsetX;
            const newY = touch.clientY - containerRect.top - offsetY;

            const maxX = containerRect.width - stickerElement.offsetWidth;
            const maxY = containerRect.height - stickerElement.offsetHeight;

            stickerElement.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            stickerElement.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        }
    }, { passive: false });

    canvasContainer.addEventListener('touchend', () => {
        if (isDraggingSticker) {
            isDraggingSticker = false;
            stickerElement.style.cursor = 'grab';
        }
    });
    stickerElement.addEventListener('touchcancel', () => {
        if (isDraggingSticker) {
            isDraggingSticker = false;
            stickerElement.style.cursor = 'grab';
        }
    });

    // Double-click to delete a sticker
    stickerElement.addEventListener('dblclick', () => {
        deleteSticker(stickerElement);
    });

    // For touch devices, handle double-tap
    let lastTap = 0;
    stickerElement.addEventListener('touchend', function(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) { // If two taps happen within 300ms
            e.preventDefault(); // Prevent accidental drag/zoom
            deleteSticker(stickerElement);
        }
        lastTap = currentTime;
    });
}

/**
 * Deletes a given sticker element.
 * @param {HTMLElement} stickerElement - The sticker element to delete.
 */
function deleteSticker(stickerElement) {
    const index = droppedStickers.indexOf(stickerElement);
    if (index > -1) {
        droppedStickers.splice(index, 1); // Remove from array
    }
    stickerElement.remove(); // Remove from DOM
    // showInfoMessage('Icon deleted!');
}


canvasContainer.addEventListener('dragover', (e) => {
    e.preventDefault(); // Allow drop
    canvasContainer.classList.add('border-indigo-400', 'border-4'); // Visual feedback
});

canvasContainer.addEventListener('dragleave', () => {
    canvasContainer.classList.remove('border-indigo-400', 'border-4');
});

canvasContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    canvasContainer.classList.remove('border-indigo-400', 'border-4');

    // Handle dropped stickers from tray
    if (draggedStickerOriginal && draggedStickerOriginal.dataset.stickerSource === 'tray') {
        const newSticker = document.createElement('div');
        newSticker.classList.add('sticker-item', 'dropped-sticker');

        // Set dropped size from the original sticker's dataset
        const droppedSize = parseInt(draggedStickerOriginal.dataset.droppedSize);
        newSticker.style.width = `${droppedSize}px`;
        newSticker.style.height = `${droppedSize}px`;
        newSticker.style.backgroundImage = draggedStickerOriginal.style.backgroundImage;
        newSticker.dataset.stickerType = 'image';
        newSticker.dataset.imageUrl = draggedStickerOriginal.dataset.imageUrl;

        // Position the sticker at the drop location relative to the container
        const containerRect = canvasContainer.getBoundingClientRect();

        // Use newSticker.offsetWidth/Height as they are now set
        newSticker.style.left = `${e.clientX - containerRect.left - newSticker.offsetWidth / 2}px`;
        newSticker.style.top = `${e.clientY - containerRect.top - newSticker.offsetHeight / 2}px`;

        canvasContainer.appendChild(newSticker);
        droppedStickers.push(newSticker); // Add to tracking array
        makeStickerDraggable(newSticker); // Make the new sticker draggable and deletable
        // showInfoMessage('Sticker added!');
        draggedStickerOriginal = null; // Reset dragged sticker
    } else {
        // Handle dropped images as templates
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                templateImage.src = event.target.result;
                showInfoMessage('Image loaded!');
            };
            reader.readAsDataURL(file);
        } else {
            showInfoMessage('Please drop an image file.');
        }
    }
});

// --- Image Upload for Template ---

imageUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            templateImage.src = event.target.result;
            showInfoMessage('Image loaded');
        };
        reader.readAsDataURL(file);
    } else {
        showInfoMessage('Please select an image file.');
    }
});

// --- Map Dropdown ---

const templates = {
    'placeholder': { name: '-- Select a Map --', url: 'https://placehold.co/900x506/e0e0e0/555555?text=Load+Image+or+Drag+Here' },
    map1: {
        name: 'Bank 2F',
        url: './img/map/bank_2f.webp'
    },
    map2: {
        name: 'Bank 1F',
        url: './img/map/bank_1f.webp'
    },
    map3: {
        name: 'Bank B1',
        url: './img/map/bank_b1.webp'
    },
    map4: {
        name: 'Border 2F',
        url: './img/map/border_2f.webp'
    },
    map5: {
        name: 'Border 1F',
        url: './img/map/border_1f.webp'
    },
    map6: {
        name: 'Chalet 2F',
        url: './img/map/chalet_2f.webp'
    },
    map7: {
        name: 'Chalet 1F',
        url: './img/map/chalet_1f.webp'
    },
    map8: {
        name: 'Chalet B1',
        url: './img/map/chalet_b1.webp'
    },
    map9: {
        name: 'Clubhouse 2F',
        url: './img/map/club_2f.webp'
    },
    map10: {
        name: 'Clubhouse 1F',
        url: './img/map/club_1f.webp'
    },
    map11: {
        name: 'Clubhouse B1',
        url: './img/map/club_b1.webp'
    },
    map12: {
        name: 'Consulate 2F',
        url: './img/map/cons_2f.webp'
    },
    map13: {
        name: 'Consulate 1F',
        url: './img/map/cons_1f.webp'
    },
    map14: {
        name: 'Consulate B1',
        url: './img/map/cons_b1.webp'
    },
    map15: {
        name: 'Kafe 3F',
        url: './img/map/kafe_3f.webp'
    },
    map16: {
        name: 'Kafe 2F',
        url: './img/map/kafe_2f.webp'
    },
    map17: {
        name: 'Kafe 1F',
        url: './img/map/kafe_1f.webp'
    },
    map18: {
        name: 'Lair 2F',
        url: './img/map/lair_2f.webp'
    },
    map19: {
        name: 'Lair 1F',
        url: './img/map/lair_1f.webp'
    },
    map20: {
        name: 'Lair B1',
        url: './img/map/lair_b1.webp'
    },
    map21: {
        name: 'Nighthaven Labs 2F',
        url: './img/map/labs_2f.webp'
    },
    map22: {
        name: 'Nighthaven Labs 1F',
        url: './img/map/labs_1f.webp'
    },
    map23: {
        name: 'Nighthaven Labs B1',
        url: './img/map/labs_b1.webp'
    },
    map24: {
        name: 'Skyscraper 2F',
        url: './img/map/sky_2f.webp'
    },
    map25: {
        name: 'Skyscraper 1F',
        url: './img/map/sky_1f.webp'
    }
};

/**
 * Populates the template dropdown with options.
 */
function populateTemplateDropdown() {
    templateSelect.innerHTML = ''; // Clear existing options
    for (const id in templates) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = templates[id].name;
        templateSelect.appendChild(option);
    }
    // Set the initial selection and load the corresponding image
    templateSelect.value = 'placeholder'; // Default to the placeholder
    templateImage.src = templates['placeholder'].url;
}

// Event listener for template dropdown change
templateSelect.addEventListener('change', (e) => {
    const selectedTemplateId = e.target.value;
    const selectedTemplate = templates[selectedTemplateId];
    if (selectedTemplate) {
        templateImage.src = selectedTemplate.url;
        // showInfoMessage(`Image "${selectedTemplate.name}" loaded!`);
    }
});

// Initialize the template dropdown when the script loads
populateTemplateDropdown();
