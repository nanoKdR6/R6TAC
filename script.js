const drawingCanvas = document.getElementById('drawingCanvas');
const ctx = drawingCanvas.getContext('2d');
const templateImage = document.getElementById('templateImage');
const canvasContainer = document.getElementById('canvasContainer');

const penColorInput = document.getElementById('penColor');
const penThicknessInput = document.getElementById('penThickness');
const thicknessValueSpan = document.getElementById('thicknessValue');
const penToolBtn = document.getElementById('penToolBtn');
const eraserToolBtn = document.getElementById('eraserToolBtn');
const arrowToolBtn = document.getElementById('arrowToolBtn');

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

// floor controls
const floorControls = document.getElementById('floorControls');
const prevFloorBtn = document.getElementById('prevFloorBtn');
const nextFloorBtn = document.getElementById('nextFloorBtn');
const currentFloorNameSpan = document.getElementById('currentFloorName');

let isDrawing = false;
let isErasing = false;
let isArrowToolActive = false; // State for arrow tool
let lastX = 0; // Used for continuous drawing (pen/eraser)
let lastY = 0; // Used for continuous drawing (pen/eraser)

// New variables for arrow drawing start and current/final end points
let arrowStartX = 0;
let arrowStartY = 0;
let arrowEndX = 0;
let arrowEndY = 0;

let currentPenColor = penColorInput.value;
let currentPenThickness = parseInt(penThicknessInput.value);

let droppedStickers = []; // Array to store dropped sticker elements for reset

// Variable to store the function to execute after confirmation
let pendingResetAction = null;

// Stores the current canvas state for clearing temporary drawings (like arrow previews)
let canvasState = null;

// Map and floor tracking variables
let currentMapId = 'placeholder'; // Stores the ID of the currently selected map group
let currentFloorIndex = 0; // Stores the index of the current floor for that map

// Sticker placement variables
let lastKnownMouseX = 0;
let lastKnownMouseY = 0;

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

    // Initialize lastKnownMouseX and Y to the center of the canvas
    lastKnownMouseX = drawingCanvas.width / 2;
    lastKnownMouseY = drawingCanvas.height / 2;
}

// Initial canvas resize and add event listener for window resize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas); // Ensure canvas is correctly sized on load

// --- Drawing Functionality ---

/**
 * Draws an arrowhead at the end of a line.
 * @param {CanvasRenderingContext2D} context - The canvas rendering context.
 * @param {number} fromX - Starting X coordinate of the line.
 * @param {number} fromY - Starting Y coordinate of the line.
 * @param {number} toX - Ending X coordinate of the line (where the arrow points).
 * @param {number} toY - Ending Y coordinate of the line (where the arrow points).
 * @param {number} arrowHeadSize - Size of the arrowhead.
 */
function drawArrowhead(context, fromX, fromY, toX, toY, arrowHeadSize) {
    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);

    const angle = Math.atan2(toY - fromY, toX - fromX);
    // Draw the two lines for the arrowhead
    context.lineTo(toX - arrowHeadSize * Math.cos(angle - Math.PI / 6), toY - arrowHeadSize * Math.sin(angle - Math.PI / 6));
    context.moveTo(toX, toY); // Move back to the tip
    context.lineTo(toX - arrowHeadSize * Math.cos(angle + Math.PI / 6), toY - arrowHeadSize * Math.sin(angle + Math.PI / 6));
    context.stroke();
}

/**
 * Handles the start of a drawing/sticker interaction.
 * @param {MouseEvent|TouchEvent} e - The event.
 */
function startDrawing(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : undefined);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : undefined);

    if (clientX === undefined || clientY === undefined) return;

    const currentCanvasX = clientX - rect.left;
    const currentCanvasY = clientY - rect.top;

    // If clicking on an existing dropped sticker, prevent drawing tools from activating
    if (e.target.classList.contains('dropped-sticker')) {
        isDrawing = false;
        return;
    }

    isDrawing = true;
    ctx.lineWidth = currentPenThickness;
    ctx.strokeStyle = currentPenColor; // Set color for all drawing types initially

    if (isArrowToolActive) {
        arrowStartX = currentCanvasX; // Store the exact start point for the arrow
        arrowStartY = currentCanvasY;
        // Save the current state of the canvas before any temporary arrow preview is drawn
        // This allows us to clear only the preview without affecting previous drawings.
        canvasState = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
    } else if (isErasing) {
        ctx.globalCompositeOperation = 'destination-out'; // This makes new drawing operations transparent
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // Color doesn't matter for destination-out
        ctx.lineWidth = currentPenThickness * 8; // Make eraser thicker
        ctx.beginPath(); // Start a new path for eraser
        ctx.moveTo(currentCanvasX, currentCanvasY);
    } else { // Pen tool
        ctx.globalCompositeOperation = 'source-over'; // Default drawing mode
        ctx.beginPath(); // Start a new path for pen
        ctx.moveTo(currentCanvasX, currentCanvasY);
        lastX = currentCanvasX; // Initialize lastX, lastY for continuous pen drawing
        lastY = currentCanvasY;
    }
}

/**
 * Continues the drawing/erasing/arrow operation.
 * @param {MouseEvent|TouchEvent} e - The event.
 */
function draw(e) {
    if (!isDrawing) return;

    const rect = drawingCanvas.getBoundingClientRect();
    const currentCanvasX = (e.clientX || e.touches[0].clientX) - rect.left;
    const currentCanvasY = (e.clientY || e.touches[0].clientY) - rect.top;

    if (isArrowToolActive) {
        // Restore canvas to the state before the arrow preview started
        if (canvasState) {
            ctx.putImageData(canvasState, 0, 0);
        }
        // Draw new temporary arrow preview
        drawArrowhead(ctx, arrowStartX, arrowStartY, currentCanvasX, currentCanvasY, 10); // 15 is arbitrary arrow head size
    } else { // Pen or Eraser
        ctx.lineTo(currentCanvasX, currentCanvasY);
        ctx.stroke();
        lastX = currentCanvasX; // Update lastX, lastY for continuous drawing
        lastY = currentCanvasY;
    }
}

/**
 * Ends the drawing/erasing/arrow operation (on mouseup/touchend).
 * @param {MouseEvent|TouchEvent} e - The event that ended the drawing.
 */
function stopDrawing(e) {
    if (!isDrawing) return; // Only process if drawing was active

    if (isArrowToolActive) {
        // Ensure final coordinates are captured from the event that stopped drawing
        const rect = drawingCanvas.getBoundingClientRect();
        let finalX = (e.clientX || (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientX)) - rect.left;
        let finalY = (e.clientY || (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientY)) - rect.top;

        // Fallback for cases where event might not have final coordinates (e.g., rapid release off canvas)
        if (isNaN(finalX) || isNaN(finalY)) {
            finalX = arrowEndX; // Use the last known point from 'draw'
            finalY = arrowEndY;
        }

        // Clear the temporary arrow preview before drawing the final one
        if (canvasState) {
            ctx.putImageData(canvasState, 0, 0);
        }
        // Draw the final arrow with an arrowhead
        drawArrowhead(ctx, arrowStartX, arrowStartY, finalX, finalY, 10);
    }

    isDrawing = false;
    ctx.globalCompositeOperation = 'source-over'; // Always reset globalCompositeOperation
    canvasState = null; // Clear the saved canvas state
    arrowStartX = 0; // Reset arrow start points
    arrowStartY = 0;
    arrowEndX = 0; // Reset arrow end points
    arrowEndY = 0;
}

/**
 * Cancels any ongoing drawing operation (e.g., on mouseout or touchcancel).
 * This clears temporary previews without drawing a final shape.
 */
function cancelDrawing() {
    if (isDrawing) { // Only do something if a drawing was in progress
        if (isArrowToolActive && canvasState) {
            ctx.putImageData(canvasState, 0, 0); // Restore canvas to clear the temporary arrow
        }
        isDrawing = false;
        ctx.globalCompositeOperation = 'source-over'; // Always reset globalCompositeOperation
        canvasState = null; // Clear the saved canvas state
        arrowStartX = 0;
        arrowStartY = 0;
        arrowEndX = 0;
        arrowEndY = 0;
    }
}

// Add drawing event listeners to the drawing canvas
drawingCanvas.addEventListener('mousedown', startDrawing);
drawingCanvas.addEventListener('mousemove', draw);
drawingCanvas.addEventListener('mouseup', stopDrawing);
drawingCanvas.addEventListener('mouseout', cancelDrawing); // Use cancelDrawing for mouseout

// Handle touch events for drawing
drawingCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    startDrawing(e); // Pass the original event object
}, { passive: false });

drawingCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling
    draw(e); // Pass the original event object
}, { passive: false });

drawingCanvas.addEventListener('touchend', stopDrawing);
drawingCanvas.addEventListener('touchcancel', cancelDrawing); // Use cancelDrawing for touchcancel

// --- Tool Controls ---

function setActiveTool(toolBtn, isPen, isEraser, isArrow) {
    // List all tool buttons to iterate
    const allToolButtons = [penToolBtn, eraserToolBtn, arrowToolBtn];

    // Remove all specific active background colors and borders from all buttons
    allToolButtons.forEach(btn => {
        btn.classList.remove(
            'bg-green-600', 'bg-blue-600', 'bg-yellow-600'
        );
        // Add the base inactive background color and transparent border
        btn.classList.add('bg-gray-800');
    });

    // Apply active styles to the selected tool
    if (toolBtn) {
        // Remove inactive background and transparent border from selected button
        toolBtn.classList.remove('bg-gray-800');
        
        // Add the specific active background color and matching border
        if (isPen) {
            toolBtn.classList.add('bg-green-600');
        } else if (isArrow) {
            toolBtn.classList.add('bg-blue-600');
        } else if (isEraser) {
            toolBtn.classList.add('bg-yellow-600');
        }
    }

    isDrawing = false; // Ensure drawing is reset when changing tools
    isErasing = isEraser;
    isArrowToolActive = isArrow; // Set arrow tool state
    canvasState = null; // Clear any active canvas state when tool changes
    arrowStartX = 0;
    arrowStartY = 0;
    arrowEndX = 0;
    arrowEndY = 0;

    // When tool changes, clear any active sticker for keyboard placement
    document.querySelectorAll('.selected-sticker-in-tray').forEach(el => {
        el.classList.remove('selected-sticker-in-tray');
    });
}

penColorInput.addEventListener('input', (e) => {
    currentPenColor = e.target.value;
    setActiveTool(penToolBtn, true, false, false); // Switch to pen when color changes
});

penThicknessInput.addEventListener('input', (e) => {
    currentPenThickness = parseInt(e.target.value);
    thicknessValueSpan.textContent = `${currentPenThickness}px`;
});

penToolBtn.addEventListener('click', () => {
    setActiveTool(penToolBtn, true, false, false);
    showInfoMessage('Pen tool selected.');
});

eraserToolBtn.addEventListener('click', () => {
    setActiveTool(eraserToolBtn, false, true, false);
    showInfoMessage('Eraser tool selected.');
});

arrowToolBtn.addEventListener('click', () => { // Arrow tool click handler
    setActiveTool(arrowToolBtn, false, false, true);
    showInfoMessage('Arrow tool selected.');
});

// Initialize tool button states
setActiveTool(penToolBtn, true, false, false); // Pen is default

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
        droppedStickers.forEach(sticker => {
            if (sticker.classList.contains('dropped-sticker')) {
                sticker.remove();
            }
        });
        droppedStickers = [];
        showInfoMessage('All icons removed!');
    });
});

resetAllBtn.addEventListener('click', () => {
    showConfirmation('Are you sure you want to reset everything (drawing and icons)?', () => {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        droppedStickers.forEach(sticker => {
            if (sticker.classList.contains('dropped-sticker')) {
                sticker.remove();
            }
        });
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

// --- Sticker Drag and Drop & Keyboard Placement ---

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
    { type: 'image', url: './img/gadget/Drone.webp', alt: 'Drone', category: 'attacker_gadget', shortcutKey: 'D' },
    { type: 'image', url: './img/gadget/HardBreach.webp', alt: 'Hard Breach', category: 'attacker_gadget', shortcutKey: 'H' },
    { type: 'image', url: './img/gadget/Rotation.webp', alt: 'Rotation', category: 'attacker_gadget', shortcutKey: 'R' },
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
    { type: 'image', url: './img/gadget/Rotation.webp', alt: 'Rotation', category: 'defender_gadget', shortcutKey: 'R' },
    { type: 'image', url: './img/gadget/Reinforcement.webp', alt: 'Reinforcement', category: 'defender_gadget', shortcutKey: 'F' },
    { type: 'image', url: './img/gadget/Barricade.webp', alt: 'Barricade', category: 'defender_gadget', shortcutKey: 'C' },
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
        stickerDiv.classList.add('sticker-item', 'flex', 'items-center', 'justify-center', 'text-sm', 'font-bold', 'relative');
        stickerDiv.setAttribute('draggable', 'true');

        let currentDroppedSize = DEFAULT_SIZE;

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

        // Add title for hover hint, including shortcut key if available
        if (stickerData.shortcutKey) {
            const keySpan = document.createElement('span');
            keySpan.textContent = stickerData.shortcutKey;
            keySpan.classList.add('absolute', 'bottom-0.5', 'right-0.5', 'text-xxs', 'font-bold', 'bg-black', 'bg-opacity-70', 'text-white', 'px-1', 'rounded-sm');
            stickerDiv.appendChild(keySpan);
        }

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
    stickerElement.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        deleteSticker(stickerElement);
    });

    // For touch devices, handle double-tap
    let lastTap = 0;
    stickerElement.addEventListener('touchend', function(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) { // If two taps happen within 300ms
            e.preventDefault(); // Prevent accidental drag/zoom
            e.stopPropagation();
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

// Update lastKnownMouseX and Y when mouse moves over the canvas container
canvasContainer.addEventListener('mousemove', (e) => {
    const rect = canvasContainer.getBoundingClientRect();
    lastKnownMouseX = e.clientX - rect.left;
    lastKnownMouseY = e.clientY - rect.top;
});

// Update lastKnownMouseX and Y when touch moves over the canvas container
canvasContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        const rect = canvasContainer.getBoundingClientRect();
        lastKnownMouseX = e.touches[0].clientX - rect.left;
        lastKnownMouseY = e.touches[0].clientY - rect.top;
    }
}, { passive: true }); // Passive true because we're just reading position, not preventing default behavior

// Centralized keydown listener for sticker placement and tool selection
document.addEventListener('keydown', (e) => {
    // Prevent default browser behavior for common shortcuts (e.g., F5 for refresh)
    if (e.key === 'F' || e.key === 'R' || e.key === 'D' || e.key === 'H' || e.key === 'C' ||
        e.key === 'B' || e.key === 'A' || e.key === 'E') {
        e.preventDefault();
    }

    let stickerToPlace = null;

    // Sticker placement shortcuts
    if (e.code === 'KeyF') {
        stickerToPlace = stickerTemplates.find(sticker => sticker.alt === 'Reinforcement' && sticker.category === 'defender_gadget');
    } else if (e.code === 'KeyR') {
        // Check both attacker and defender gadgets for 'Rotation' as it exists in both
        stickerToPlace = stickerTemplates.find(sticker => sticker.alt === 'Rotation' && (sticker.category === 'attacker_gadget' || sticker.category === 'defender_gadget'));
    } else if (e.code === 'KeyD' && !e.repeat) { // Add !e.repeat to prevent multiple drones on hold
        stickerToPlace = stickerTemplates.find(sticker => sticker.alt === 'Drone' && sticker.category === 'attacker_gadget');
    } else if (e.code === 'KeyH') {
        stickerToPlace = stickerTemplates.find(sticker => sticker.alt === 'Hard Breach' && sticker.category === 'attacker_gadget');
    } else if (e.code === 'KeyC') {
        stickerToPlace = stickerTemplates.find(sticker => sticker.alt === 'Barricade' && sticker.category === 'defender_gadget');
    }

    if (stickerToPlace) {
        const newSticker = document.createElement('div');
        newSticker.classList.add('sticker-item', 'dropped-sticker');

        const droppedSize = parseInt(stickerToPlace.droppedSize || DEFAULT_SIZE); // Use specific or default gadget size
        newSticker.style.width = `${droppedSize}px`;
        newSticker.style.height = `${droppedSize}px`;
        newSticker.style.backgroundImage = `url('${stickerToPlace.url}')`;
        newSticker.dataset.stickerType = stickerToPlace.type;
        newSticker.dataset.imageUrl = stickerToPlace.url;

        // Position the sticker at the last known mouse coordinates, centered
        newSticker.style.left = `${lastKnownMouseX - droppedSize / 2}px`;
        newSticker.style.top = `${lastKnownMouseY - droppedSize / 2}px`;

        canvasContainer.appendChild(newSticker);
        droppedStickers.push(newSticker);
        makeStickerDraggable(newSticker);
    }

    // Tool selection shortcuts
    if (e.code === 'KeyB') {
        setActiveTool(penToolBtn, true, false, false);
        showInfoMessage('Pen tool selected.');
    } else if (e.code === 'KeyA') {
        setActiveTool(arrowToolBtn, false, false, true);
        showInfoMessage('Arrow tool selected.');
    } else if (e.code === 'KeyE') {
        setActiveTool(eraserToolBtn, false, true, false);
        showInfoMessage('Eraser tool selected.');
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

// --- Map and Floor Selection ---

const maps = {
    'placeholder': {
        name: '-- Select a Map --',
        floors: [{ name: 'Placeholder', url: 'https://placehold.co/900x506/e0e0e0/555555?text=Load+Image+or+Drag+Here' }],
        defaultFloorIndex: 0
    },
    'bank': {
        name: 'Bank',
        floors: [
            { name: '2F', url: './img/map/bank_2f.webp' },
            { name: '1F', url: './img/map/bank_1f.webp' },
            { name: 'B1', url: './img/map/bank_b1.webp' },
        ],
        defaultFloorIndex: 0 // Start at 2F
    },
    'border': {
        name: 'Border',
        floors: [
            { name: '2F', url: './img/map/border_2f.webp' },
            { name: '1F', url: './img/map/border_1f.webp' },
        ],
        defaultFloorIndex: 0
    },
    'chalet': {
        name: 'Chalet',
        floors: [
            { name: '2F', url: './img/map/chalet_2f.webp' },
            { name: '1F', url: './img/map/chalet_1f.webp' },
            { name: 'B1', url: './img/map/chalet_b1.webp' },
        ],
        defaultFloorIndex: 0
    },
    'clubhouse': {
        name: 'Clubhouse',
        floors: [
            { name: '2F', url: './img/map/club_2f.webp' },
            { name: '1F', url: './img/map/club_1f.webp' },
            { name: 'B1', url: './img/map/club_b1.webp' },
        ],
        defaultFloorIndex: 0
    },
    'consulate': {
        name: 'Consulate',
        floors: [
            { name: '2F', url: './img/map/cons_2f.webp' },
            { name: '1F', url: './img/map/cons_1f.webp' },
            { name: 'B1', url: './img/map/cons_b1.webp' },
        ],
        defaultFloorIndex: 0
    },
    'kafe': {
        name: 'Kafe Dostoyevsky',
        floors: [
            { name: '3F', url: './img/map/kafe_3f.webp' },
            { name: '2F', url: './img/map/kafe_2f.webp' },
            { name: '1F', url: './img/map/kafe_1f.webp' },
        ],
        defaultFloorIndex: 0
    },
    'lair': {
        name: 'Lair',
        floors: [
            { name: '2F', url: './img/map/lair_2f.webp' },
            { name: '1F', url: './img/map/lair_1f.webp' },
            { name: 'B1', url: './img/map/lair_b1.webp' },
        ],
        defaultFloorIndex: 0
    },
    'nighthavenlabs': {
        name: 'Nighthaven Labs',
        floors: [
            { name: '2F', url: './img/map/labs_2f.webp' },
            { name: '1F', url: './img/map/labs_1f.webp' },
            { name: 'B1', url: './img/map/labs_b1.webp' },
        ],
        defaultFloorIndex: 0
    },
    'skyscraper': {
        name: 'Skyscraper',
        floors: [
            { name: '2F', url: './img/map/sky_2f.webp' },
            { name: '1F', url: './img/map/sky_1f.webp' },
        ],
        defaultFloorIndex: 0
    },
};

/**
 * Populates the template dropdown with map names.
 */
function populateTemplateDropdown() {
    templateSelect.innerHTML = '';
    // Add a default "Select a map" option
    const defaultOption = document.createElement('option');
    defaultOption.value = 'placeholder';
    defaultOption.textContent = maps['placeholder'].name;
    templateSelect.appendChild(defaultOption);

    for (const id in maps) {
        if (id === 'placeholder') continue;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = maps[id].name;
        templateSelect.appendChild(option);
    }
    // Set initial selection and load corresponding image and floor controls
    templateSelect.value = 'placeholder';
    loadMapAndFloor('placeholder', 0);
}

/**
 * Loads a specific map and floor, updates the image and floor controls.
 * @param {string} mapId - The ID of the map to load.
 * @param {number} floorIndex - The index of the floor to load within that map.
 */
function loadMapAndFloor(mapId, floorIndex) {
    if (!maps[mapId]) {
        console.error(`Map ID "${mapId}" not found.`);
        return;
    }
    const map = maps[mapId];
    if (floorIndex < 0 || floorIndex >= map.floors.length) {
        console.error(`Floor index ${floorIndex} out of bounds for map "${mapId}".`);
        return;
    }

    currentMapId = mapId;
    currentFloorIndex = floorIndex;

    templateImage.src = map.floors[currentFloorIndex].url;
    updateFloorDisplay();
    updateFloorButtonsState();
}

/**
 * Updates the text display for the current floor.
 */
function updateFloorDisplay() {
    if (maps[currentMapId] && maps[currentMapId].floors[currentFloorIndex]) {
        currentFloorNameSpan.textContent = maps[currentMapId].floors[currentFloorIndex].name;
    } else {
        currentFloorNameSpan.textContent = '--';
    }
}

/**
 * Updates the enabled/disabled state of the floor switching buttons.
 */
function updateFloorButtonsState() {
    const map = maps[currentMapId];
    if (!map || map.floors.length <= 1) {
        prevFloorBtn.disabled = true;
        nextFloorBtn.disabled = true;
        floorControls.classList.add('hidden');
    } else {
        floorControls.classList.remove('hidden');
        prevFloorBtn.disabled = (currentFloorIndex === 0);
        nextFloorBtn.disabled = (currentFloorIndex === map.floors.length - 1);
    }
}

// Event listener for map dropdown change
templateSelect.addEventListener('change', (e) => {
    const selectedMapId = e.target.value;
    const map = maps[selectedMapId];
    if (map) {
        loadMapAndFloor(selectedMapId, map.defaultFloorIndex);
    }
});

// Event listeners for floor switching buttons
prevFloorBtn.addEventListener('click', () => {
    if (currentFloorIndex > 0) {
        loadMapAndFloor(currentMapId, currentFloorIndex - 1);
    }
});

nextFloorBtn.addEventListener('click', () => {
    const map = maps[currentMapId];
    if (map && currentFloorIndex < map.floors.length - 1) {
        loadMapAndFloor(currentMapId, currentFloorIndex + 1);
    }
});


// Initialize the template dropdown and map display when the script loads
populateTemplateDropdown();
updateFloorDisplay();
updateFloorButtonsState();
