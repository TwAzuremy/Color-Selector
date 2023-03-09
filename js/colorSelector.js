const color_box = document.querySelector('#dm-color-box'),
    color_boxPanel = document.querySelector('.dm-color-box'),
    pound_sign = document.querySelector('.pound-sign'),
    color_input = document.querySelector('#dm-color-input'),
    copy_btn = document.querySelector('.dm-copy');

var need_pound = true;

// states
let saturation = 1; // 0 - 1 饱和度
let brightness = 1; // 0 - 1 亮度
let hue = 0; // 0 - 360 deg 色相
let currentColor;

function setCurrentColor() {
    currentColor = tinycolor(`hsv(${hue}, ${saturation * 100}%, ${brightness * 100}%)`);
    color_input.value = need_pound ? currentColor.toHexString() : currentColor.toHexString().replace('#', '');
    color_box.style.backgroundColor = currentColor.toHexString();
}

window.onload = () => {
    drawSaturationPicker();
    setCurrentColor();
    need_pound ? pound_sign.classList.add('pound') : '';
    ADJUST_MAXLENGTH();
}

color_box.addEventListener('click', () => {
    color_boxPanel.classList.toggle('open');
})

pound_sign.addEventListener('click', () => {
    pound_sign.classList.toggle('pound');
    need_pound = !need_pound;
    ADJUST_MAXLENGTH();
    POUND_OPERATION();
    color_input.dispatchEvent(new Event('keyup'));
})

color_input.addEventListener('keyup', () => {
    // Only input #, numb and letter
    color_input.value = color_input.value.replace(/[^A-Fa-f0-9\#]/ig, '');
    color_input.classList.remove('error');

    let colorHEX = color_input.value;

    if (colorHEX.trim() == '') {
        return;
    }

    if (verifyColor(colorHEX)) {
        color_box.style.backgroundColor = format_HEX(colorHEX);
        var hsv = tinycolor(format_HEX(colorHEX));
        adjust_position(hsv.toHsvString());
    } else {
        color_input.classList.add('error');
    }
})

copy_btn.addEventListener('click', () => {
    copy_btn.previousElementSibling.select();
})

function verifyColor(hex) {
    if (need_pound) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    return /^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

function format_HEX(hex) {
    return need_pound ? hex : '#' + hex;
}

function ADJUST_MAXLENGTH() {
    color_input.maxLength = need_pound ? 7 : 6;
}

function POUND_OPERATION() {
    if (color_input.value.trim() == '') {
        return;
    }

    need_pound ? ADDPOUND() : REMOVEPOUND();

    function ADDPOUND() {
        color_input.value = '#' + color_input.value;
    }

    function REMOVEPOUND() {
        color_input.value = color_input.value.replace(/[\#]/g, '');
    }
}

// canvas
const canvas = document.querySelector('.saturation-canvas');

function drawSaturationPicker() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = tinycolor(`hsv(${hue}, 1, 1)`).toHexString();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const whiteGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    whiteGradient.addColorStop(0, '#ffffff');
    whiteGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = whiteGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const blackGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    blackGradient.addColorStop(0, 'transparent');
    blackGradient.addColorStop(1, '#000000');
    ctx.fillStyle = blackGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// mouse event
const saturationBox = document.querySelector('.saturation-box'),
    saturationPicker = saturationBox.querySelector('.saturation-picker');

const stripBox = document.querySelector('.strip-box'),
    stripPicker = stripBox.querySelector('.strip-picker');

let pickingSaturationHandler, pickingStripHandler;

function handleMouseMove(target, callback, onHanlerCreate) {
    const rect = target.getBoundingClientRect();
    const { left, top, width, height } = rect;

    const handler = (e) => {
        const { clientX, clientY } = e;
        let x = clientX - left,
            y = clientY - top;

        let xRatio, yRatio;
        if (x <= 0) {
            xRatio = 0;
            x = 0;
        } else if (x > width) {
            xRatio = 1;
            x = width;
        } else {
            xRatio = x / width;
        }

        if (y <= 0) {
            yRatio = 0;
            y = 0;
        } else if (y > height) {
            yRatio = 1;
            y = height;
        } else {
            yRatio = y / height;
        }

        // console.log(xRatio, yRatio);

        callback({
            x, y, xRatio, yRatio
        });
    }

    onHanlerCreate(handler);
    window.addEventListener('mousemove', handler);
}

// handle saturation move
saturationBox.addEventListener('mousedown', (e) => {
    handleMouseMove(
        saturationBox,
        ({ x, y, xRatio, yRatio }) => {
            saturationPicker.style.left = x + 'px';
            saturationPicker.style.top = y + 'px';
            saturation = xRatio;
            brightness = 1 - yRatio;
            setCurrentColor();
        },
        (handler) => {
            pickingSaturationHandler = handler;
        }
    )
});
window.addEventListener('mouseup', (e) => {
    window.removeEventListener('mousemove', pickingSaturationHandler);
})

// handle strip move
stripBox.addEventListener('mousedown', (e) => {
    handleMouseMove(
        stripBox,
        ({ y, yRatio }) => {
            stripPicker.style.top = y + 'px';
            hue = yRatio * 360;
            setCurrentColor();
            drawSaturationPicker();
        },
        (handler) => {
            pickingStripHandler = handler;
        }
    )
});
window.addEventListener('mouseup', (e) => {
    window.removeEventListener('mousemove', pickingStripHandler);
});

function adjust_position(hsv) {
    hsv = hsv.replace(/[hsv\(\) ]/g, '').trim().split(',');
    hue = hsv[0];
    saturation = parseFloat(hsv[1]) / 100;
    brightness = parseFloat(hsv[2]) / 100;

    // strip picker
    stripPicker.style.top = (hue == '0' ? 0 : hue / 360) * 100 + '%';
    drawSaturationPicker();

    // saturation picker
    saturationPicker.style.left = (saturation * 100) + '%';
    saturationPicker.style.top = (100 - brightness * 100) + '%';
}