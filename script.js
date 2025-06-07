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


// --- Icon Drag and Drop ---

let draggedStickerOriginal = null; // Represents the sticker being dragged from the tray

// Sticker data with categories for Attacker, Defender, Attacker Gadgets, Defender Gadgets
const stickerTemplates = [
    // Attacker Operators
    { type: 'image', url: './img/opr/a1_striker.png', alt: 'Striker', category: 'attacker' },
    // Defender Operators
    { type: 'text', text: 'Smoke', bgColor: '#dc2626', textColor: '#ffffff', category: 'defender' },
    { type: 'text', text: 'Mute', bgColor: '#dc2626', textColor: '#ffffff', category: 'defender' },
    { type: 'text', text: 'Castle', bgColor: '#dc2626', textColor: '#ffffff', category: 'defender' },
    { type: 'text', text: 'Pulse', bgColor: '#dc2626', textColor: '#ffffff', category: 'defender' },
    // Attacker Gadgets
    { type: 'text', text: 'Breach', bgColor: '#4a5568', textColor: '#cbd5e0', category: 'attacker_gadget' },
    { type: 'text', text: 'Flash', bgColor: '#4a5568', textColor: '#cbd5e0', category: 'attacker_gadget' },
    { type: 'image', url: 'https://placehold.co/50x50/007bff/ffffff?text=C4', alt: 'C4', category: 'attacker_gadget' },
    // Defender Gadgets
    { type: 'text', text: 'Barbed', bgColor: '#4a5568', textColor: '#cbd5e0', category: 'defender_gadget' },
    { type: 'text', text: 'Shield', bgColor: '#4a5568', textColor: '#cbd5e0', category: 'defender_gadget' },
    { type: 'image', url: 'https://placehold.co/50x50/ffc107/333333?text=Wire', alt: 'Barbed Wire', category: 'defender_gadget' },
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

        if (stickerData.type === 'text') {
            stickerDiv.textContent = stickerData.text;
            stickerDiv.style.backgroundColor = stickerData.bgColor;
            stickerDiv.style.color = stickerData.textColor;
            stickerDiv.dataset.stickerType = 'text';
            stickerDiv.dataset.text = stickerData.text;
        } else if (stickerData.type === 'image') {
            stickerDiv.style.backgroundImage = `url('${stickerData.url}')`;
            stickerDiv.dataset.stickerType = 'image';
            stickerDiv.dataset.imageUrl = stickerData.url;
        }
        stickerDiv.dataset.stickerSource = 'tray'; // Identify as original from tray

        stickerDiv.addEventListener('dragstart', (e) => {
            draggedStickerOriginal = stickerDiv;
            e.dataTransfer.setData('text/plain', stickerDiv.dataset.stickerType); // Set data for drag
            e.dataTransfer.setDragImage(stickerDiv, 25, 25); // Set custom drag image
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

        // Copy styles/data from the original sticker
        if (draggedStickerOriginal.dataset.stickerType === 'text') {
            newSticker.textContent = draggedStickerOriginal.dataset.text;
            newSticker.style.backgroundColor = draggedStickerOriginal.style.backgroundColor;
            newSticker.style.color = draggedStickerOriginal.style.color;
        } else if (draggedStickerOriginal.dataset.stickerType === 'image') {
            newSticker.style.backgroundImage = draggedStickerOriginal.style.backgroundImage;
        }

        // Position the sticker at the drop location relative to the container
        const containerRect = canvasContainer.getBoundingClientRect();
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
        url: './img/map/bank_2f.jpg'
    },
    map2: {
        name: 'Bank 1F',
        url: './img/map/bank_1f.jpg'
    },
    map3: {
        name: 'Bank B1',
        url: './img/map/bank_b1.jpg'
    },
    map4: {
        name: 'Border 2F',
        url: './img/map/border_2f.jpg'
    },
    map5: {
        name: 'Border 1F',
        url: './img/map/border_1f.jpg'
    },
    map6: {
        name: 'Chalet 2F',
        url: './img/map/chalet_2f.jpg'
    },
    map7: {
        name: 'Chalet 1F',
        url: './img/map/chalet_1f.jpg'
    },
    map8: {
        name: 'Chalet B1',
        url: './img/map/chalet_b1.jpg'
    },
    map9: {
        name: 'Clubhouse 2F',
        url: './img/map/club_2f.jpg'
    },
    map10: {
        name: 'Clubhouse 1F',
        url: './img/map/club_1f.jpg'
    },
    map11: {
        name: 'Clubhouse B1',
        url: './img/map/club_b1.jpg'
    },
    map12: {
        name: 'Consulate 2F',
        url: './img/map/cons_2f.jpg'
    },
    map13: {
        name: 'Consulate 1F',
        url: './img/map/cons_1f.jpg'
    },
    map14: {
        name: 'Consulate B1',
        url: './img/map/cons_b1.jpg'
    },
    map15: {
        name: 'Kafe 3F',
        url: './img/map/kafe_3f.jpg'
    },
    map16: {
        name: 'Kafe 2F',
        url: './img/map/kafe_2f.jpg'
    },
    map17: {
        name: 'Kafe 1F',
        url: './img/map/kafe_1f.jpg'
    },
    map18: {
        name: 'Lair 2F',
        url: './img/map/lair_2f.jpg'
    },
    map19: {
        name: 'Lair 1F',
        url: './img/map/lair_1f.jpg'
    },
    map20: {
        name: 'Lair B1',
        url: './img/map/lair_b1.jpg'
    },
    map21: {
        name: 'Nighthaven Labs 2F',
        url: './img/map/labs_2f.jpg'
    },
    map22: {
        name: 'Nighthaven Labs 1F',
        url: './img/map/labs_1f.jpg'
    },
    map23: {
        name: 'Nighthaven Labs B1',
        url: './img/map/labs_b1.jpg'
    },
    map24: {
        name: 'Skyscraper 2F',
        url: './img/map/sky_2f.jpg'
    },
    map25: {
        name: 'Skyscraper 1F',
        url: './img/map/sky_1f.jpg'
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
