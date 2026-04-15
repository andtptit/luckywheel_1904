export class LuckyWheel {
    constructor(canvasId, items, onSpinEnd) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.items = items;
        this.onSpinEnd = onSpinEnd;
        this.isSpinning = false;
        this.currentDeg = 0;
        
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
            ctx.fillStyle = this.colors[i % this.colors.length];
            ctx.fill();

            // Draw border
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(i * step + step / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Inter';
            
            // Limit text length
            let text = this.items[i];
            if (text.length > 20) text = text.substring(0, 20) + '...';
            
            // Add shadow to text for better readability
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 4;
            ctx.fillText(text, radius - 30, 6);
            ctx.restore();
        }
    }

    spin() {
        if (this.isSpinning || this.items.length === 0) return;
        this.isSpinning = true;

        const spinTime = 5000; // 5 seconds
        // Need to set a winning index. Let's make it random.
        const winIndex = Math.floor(Math.random() * this.items.length);
        
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
                this.onSpinEnd(this.items[winIndex], winIndex);
            }
        }, spinTime + 100);
    }
}
