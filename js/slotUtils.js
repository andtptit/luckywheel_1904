export class SlotMachine {
    constructor(containerId, items, onSpinEnd) {
        this.container = document.getElementById(containerId);
        this.strip = this.container.querySelector('.slot-strip');
        this.items = items;
        this.onSpinEnd = onSpinEnd;
        this.isSpinning = false;
        
        this.itemHeight = 100; // Chiều cao mỗi item
        this.currentY = 0;
        this.spinFrame = null;
        this.lastTimestamp = 0;
        
        this.init();
    }

    setItems(newItems) {
        this.items = newItems;
        this.init();
    }

    init() {
        if (this.items.length === 0) {
            this.strip.innerHTML = '<div class="slot-item">Chưa có ứng viên</div>';
            return;
        }

        // Tạo dải tên lặp lại để tạo hiệu ứng cuộn vô tận ảo
        // Nhân 10 lần danh sách để cuộn mượt
        let html = '';
        const displayItems = this.items.length < 5 ? [...this.items, ...this.items, ...this.items] : this.items;
        
        // Tạo khoảng 100 item để cuộn cho sướng
        const repeatCount = Math.ceil(100 / displayItems.length);
        for (let r = 0; r < repeatCount; r++) {
            displayItems.forEach(item => {
                html += `<div class="slot-item">${item}</div>`;
            });
        }
        this.strip.innerHTML = html;
        this.currentY = 0;
        this.strip.style.transform = `translateY(0px)`;
        this.strip.style.transition = 'none';
    }

    startInfinite() {
        if (this.isSpinning || this.items.length === 0) return;
        this.isSpinning = true;
        this.strip.style.transition = 'none';
        
        this.lastTimestamp = performance.now();
        const speed = 2000; // pixels per second (Rất nhanh)
        const stripHeight = this.strip.scrollHeight / 2; // Một nửa dải để loop

        const animate = (timestamp) => {
            if (!this.isSpinning) return;
            const dt = (timestamp - this.lastTimestamp) / 1000;
            this.lastTimestamp = timestamp;

            this.currentY -= speed * dt;
            
            // Loop quay vòng ảo
            if (Math.abs(this.currentY) >= stripHeight) {
                this.currentY = 0;
            }

            this.strip.style.transform = `translateY(${this.currentY}px)`;
            this.spinFrame = requestAnimationFrame(animate);
        };
        this.spinFrame = requestAnimationFrame(animate);
    }

    stop(winIndex) {
        if (!this.isSpinning) return;
        cancelAnimationFrame(this.spinFrame);
        this.spinFrame = null;

        const spinTime = 6000; // Hãm phanh trong 6s
        
        // Tính toán vị trí dừng
        // Chúng ta muốn item winIndex nằm ở chính giữa khung (Winner frame)
        // Winner frame cao 100px, nằm ở giữa container cao 400px -> top: 150px
        const winnerFrameOffset = 150; 
        
        // Vị trí của item trúng giải trong strip (lấy một item ở gần cuối dải để cuộn cho dài)
        const itemsCount = this.strip.querySelectorAll('.slot-item').length;
        const targetItemIndex = itemsCount - (this.items.length * 2) + winIndex; 
        
        const finalY = -(targetItemIndex * this.itemHeight) + winnerFrameOffset;

        this.strip.style.transition = `transform ${spinTime}ms cubic-bezier(0.1, 0.7, 0.15, 1)`;
        this.strip.style.transform = `translateY(${finalY}px)`;
        
        this.currentY = finalY;

        setTimeout(() => {
            this.isSpinning = false;
            if (this.onSpinEnd) {
                this.onSpinEnd(this.items[winIndex], winIndex);
            }
        }, spinTime + 100);
    }
}
