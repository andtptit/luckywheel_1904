export class LuckyWheel {
    constructor(canvasId, items, onSpinEnd) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.items = items;
        this.onSpinEnd = onSpinEnd;
        this.isSpinning = false;
        this.currentDeg = 0;
        this.spinFrame = null;
        this.lastTimestamp = 0;
        
        // Premium Colors
        this.colors = [
            '#c2002f', '#003478', '#d4af37', '#0f172a', '#475569', '#8a0022'
        ];

        this.draw();
    }

    setItems(newItems) {
        this.items = newItems;
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = width / 2;

        ctx.clearRect(0, 0, width, height);

        if (this.items.length === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#ccc';
            ctx.fill();
            return;
        }

        const step = (2 * Math.PI) / this.items.length;

        for (let i = 0; i < this.items.length; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, i * step, (i + 1) * step);
            // Hỗ trợ truyền thẳng string hoặc lấy từ object
            const itemObj = typeof this.items[i] === 'object' ? this.items[i] : { text: this.items[i] };
            
            ctx.fillStyle = itemObj.bgColor || this.colors[i % this.colors.length];
            ctx.fill();

            // Draw border
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.stroke();

            // Draw text with Multi-line support
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(i * step + step / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = itemObj.textColor || '#fff';
            ctx.font = "bold 16px 'Be Vietnam Pro'";
            
            const text = itemObj.text || '';
            const maxLineWidth = radius - 80;

            const words = text.split(' ');
            const lines = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (ctx.measureText(testLine).width < maxLineWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine) lines.push(currentLine);

            const lineHeight = 20;
            const totalHeight = lines.length * lineHeight;
            
            // Add shadow to text for better readability
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 4;
            
            lines.forEach((line, index) => {
                // Center lines vertically
                const yOffset = (lineHeight * index) - (totalHeight / 2) + (lineHeight / 2);
                ctx.fillText(line.trim(), radius - 30, yOffset + 4);
            });
            ctx.restore();
        }
    }

    spin(targetIndex) {
        if (this.isSpinning || this.items.length === 0) return;
        this.isSpinning = true;

        const spinTime = 5000; // 5 seconds
        // Cho phép nhận targetIndex từ bên ngoài (ví dụ logic xác suất)
        const winIndex = targetIndex !== undefined ? targetIndex : Math.floor(Math.random() * this.items.length);
        
        // Calculate degrees to rotate
        const step = 360 / this.items.length;
        const targetDeg = (360 - (winIndex * step)) - (step / 2);
        
        // Add full rotations
        const totalDeg = this.currentDeg + (360 * 5) + targetDeg - (this.currentDeg % 360);
        
        this.canvas.style.transform = `rotate(${totalDeg}deg)`;
        this.canvas.style.transition = `transform ${spinTime}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
        
        this.currentDeg = totalDeg;

        setTimeout(() => {
            this.isSpinning = false;
            if (this.onSpinEnd) {
                const itemObj = typeof this.items[winIndex] === 'object' ? this.items[winIndex] : { text: this.items[winIndex] };
                this.onSpinEnd(itemObj.text, winIndex);
            }
        }, spinTime + 100);
    }

    startInfiniteSpin() {
        if (this.isSpinning || this.items.length === 0) return;
        this.isSpinning = true;
        this.canvas.style.transition = 'none';
        
        this.lastTimestamp = performance.now();
        const spinSpeed = 720; // degrees per second (nhanh)
        
        const animate = (timestamp) => {
             if(!this.isSpinning) return;
             
             const dt = (timestamp - this.lastTimestamp) / 1000;
             this.lastTimestamp = timestamp;
             
             this.currentDeg += spinSpeed * dt;
             this.canvas.style.transform = `rotate(${this.currentDeg}deg)`;
             
             this.spinFrame = requestAnimationFrame(animate);
        };
        this.spinFrame = requestAnimationFrame(animate);
    }

    stopSpin(targetIndex) {
        if(!this.isSpinning || this.spinFrame === null) return;
        
        cancelAnimationFrame(this.spinFrame);
        this.spinFrame = null;
        
        const spinTime = 6000; // Quay chậm lại trong 6s
        // Cho phép nhận targetIndex từ bên ngoài
        const winIndex = targetIndex !== undefined ? targetIndex : Math.floor(Math.random() * this.items.length);
        
        // Calculate degrees to rotate
        const step = 360 / this.items.length;
        const targetDeg = (360 - (winIndex * step)) - (step / 2);
        
        const remainder = this.currentDeg % 360; 
        const extraRotations = 360 * 5; // Thêm 5 vòng nữa cho 6 giây mượt mà
        
        const endDeg = this.currentDeg - remainder + extraRotations + targetDeg;
        
        this.canvas.style.transition = `transform ${spinTime}ms cubic-bezier(0.1, 0.7, 0.15, 1)`;
        this.canvas.style.transform = `rotate(${endDeg}deg)`;
        
        this.currentDeg = endDeg;

        setTimeout(() => {
            this.isSpinning = false;
            if (this.onSpinEnd) {
                const itemObj = typeof this.items[winIndex] === 'object' ? this.items[winIndex] : { text: this.items[winIndex] };
                this.onSpinEnd(itemObj.text, winIndex);
            }
        }, spinTime + 100);
    }
}

