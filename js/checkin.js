import { LuckyWheel } from './wheelUtils.js';
import confetti from 'canvas-confetti';

const CHECKIN_PRIZES = [
    'Khóa học say Annyeong',
    'Khóa học E-Learning - xxx',
    'Khóa học E-Learning - xxxxx',
    'Khóa học E-Learning - xxxxxxxxxx'
];

document.addEventListener('DOMContentLoaded', () => {
    const wheel = new LuckyWheel('checkinWheel', CHECKIN_PRIZES, (wonItem) => {
        showResult(wonItem);
    });

    const form = document.getElementById('checkinForm');
    const statusDiv = document.getElementById('checkinStatus');
    const resultModal = document.getElementById('resultModal');
    let currentUserName = '';

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (wheel.isSpinning) return;

        const name = document.getElementById('fullname').value.trim();
        const phone = document.getElementById('phone').value.trim();

        // MOCK: Kiểm tra database qua LocalStorage
        let db = JSON.parse(localStorage.getItem('luckywheel_db') || '{}');
        
        if (db[phone]) {
            statusDiv.textContent = '❌ Số điện thoại này đã tham gia quay số trước đó!';
            statusDiv.style.color = '#ff5252';
            return;
        }

        // Đủ điều kiện quay
        statusDiv.textContent = 'Đang quay... 🎡';
        statusDiv.style.color = '#ffeb3b';
        currentUserName = name;
        
        // Lưu trước để tránh load lại trang quay 2 lần
        db[phone] = { name, checkinAt: new Date().toISOString() };
        localStorage.setItem('luckywheel_db', JSON.stringify(db));

        // Disable button
        form.querySelector('button').disabled = true;
        
        wheel.spin();
    });

    function showResult(prize) {
        statusDiv.textContent = 'Quay hoàn tất!';
        
        // Update DB with prize
        const phone = document.getElementById('phone').value.trim();
        let db = JSON.parse(localStorage.getItem('luckywheel_db') || '{}');
        if (db[phone]) {
            db[phone].prize = prize;
            localStorage.setItem('luckywheel_db', JSON.stringify(db));
        }

        document.getElementById('winnerName').textContent = currentUserName;
        document.getElementById('prizeText').textContent = prize;
        resultModal.classList.add('active');

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        // Reset for next
        form.reset();
        form.querySelector('button').disabled = false;
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 5000);
    }
});
