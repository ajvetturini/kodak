import React, { useRef, useEffect, useState } from 'react';
import './ColorPicker.css'

const presetColors = ['#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#882255', '#AA4499'];

const ColorPicker: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
    const [selectedColor, setSelectedColor] = useState(value);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleColorChange = (color: string) => {
        setSelectedColor(color);
        onChange(color);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const radius = canvas.width / 2;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const dx = x - radius;
                const dy = y - radius;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const angle = Math.atan2(dy, dx);
                let hue = (angle + Math.PI) / (2 * Math.PI);
                if (hue < 0) hue += 1;

                const saturation = distance / radius;
                const lightness = 0.5;

                const index = (y * canvas.width + x) * 4;
                const rgb = hslToRgb(hue, saturation, lightness);
                imageData.data[index] = rgb[0];
                imageData.data[index + 1] = rgb[1];
                imageData.data[index + 2] = rgb[2];
                imageData.data[index + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }, []);

    const hslToRgb = (h: number, s: number, l: number): number[] => {
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const imageData = ctx.getImageData(x, y, 1, 1);
        const rgb = [imageData.data[0], imageData.data[1], imageData.data[2]];
        const hex = rgbToHex(rgb);

        onChange(hex);
    };

    const rgbToHex = (rgb: number[]): string => {
        return '#' + rgb.map(component => component.toString(16).padStart(2, '0')).join('');
    };

    return (
        <canvas
            ref={canvasRef}
            className="color-wheel"
            width={300} // Adjust the size of the canvas as needed
            height={300} // Adjust the size of the canvas as needed
            onClick={handleCanvasClick}
        />
    );
};

export default ColorPicker;
