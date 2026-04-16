import { LuckyWheel } from './wheelUtils.js';
import confetti from 'canvas-confetti';
import { db } from './firebase.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    let checkinPrizes = [];
    const wheel = new LuckyWheel('checkinWheel', [], (wonItem) => {
        showResult(wonItem);
    });

    // Lấy quỹ giải thưởng Check-in từ Firebase
    async function fetchPrizes() {
        try {
            const snap = await getDoc(doc(db, "config", "checkin_prizes"));
            if (snap.exists()) {
                const data = snap.data();
                checkinPrizes = data.items || [];
                // Backward compatibility if items are just strings
                checkinPrizes = checkinPrizes.map(p => {
                    if (typeof p === 'string') {
                        return { text: p, prob: 10, textColor: '#ffffff', bgColor: '#1d4289' };
                    }
                    return p;
                });
                wheel.setItems(checkinPrizes);
            }
        } catch(error) {
            console.error("Lỗi tải danh sách giải thưởng:", error);
        }
    }
    fetchPrizes();



    const form = document.getElementById('checkinForm');
    const statusDiv = document.getElementById('checkinStatus');
    const resultModal = document.getElementById('resultModal');
    let currentUserName = '';
    let currentPhone = '';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (wheel.isSpinning) return;

        const name = document.getElementById('fullname').value.trim();
        const phone = document.getElementById('phone').value.trim();

        statusDiv.textContent = 'Đang kiểm tra thông tin...';
        statusDiv.style.color = '#ffeb3b';

        try {
            // Kiểm tra trùng SĐT trên Firestore
            const participantsRef = collection(db, "participants");
            const q = query(participantsRef, where("phone", "==", phone));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                statusDiv.textContent = '❌ Số điện thoại này đã tham gia quay số trước đó!';
                statusDiv.style.color = '#ff5252';
                return;
            }

            // Đủ điều kiện quay
            statusDiv.textContent = 'Đang quay... 🎡';
            currentUserName = name;
            currentPhone = phone;
            
            // Disable button
            form.querySelector('button').disabled = true;

            // Tính toán xác suất trúng
            let winIndex = 0;
            const totalProb = checkinPrizes.reduce((sum, item) => sum + (parseFloat(item.prob) || 0), 0);
            
            if (totalProb > 0) {
                let random = Math.random() * totalProb;
                for (let i = 0; i < checkinPrizes.length; i++) {
                    const prob = parseFloat(checkinPrizes[i].prob) || 0;
                    if (random < prob) {
                        winIndex = i;
                        break;
                    }
                    random -= prob;
                }
            } else {
                // Rơi vào random đều nếu tổng xác suất = 0
                winIndex = Math.floor(Math.random() * checkinPrizes.length);
            }

            wheel.spin(winIndex);
            
        } catch (error) {
            console.error("Lỗi Firebase:", error);
            statusDiv.textContent = '❌ Lỗi kết nối database! Vui lòng kiểm tra config Firebase.';
            statusDiv.style.color = '#ff5252';
        }
    });

    async function showResult(prize) {
        statusDiv.textContent = 'Quay hoàn tất! Đang lưu kết quả...';
        
        try {
            // Lưu kết quả vào Firestore
            await addDoc(collection(db, "participants"), {
                name: currentUserName,
                phone: currentPhone,
                prize: prize,
                createdAt: serverTimestamp()
            });
            
            statusDiv.textContent = 'Đã lưu kết quả thành công!';
        } catch (error) {
            console.error("Lỗi lưu data:", error);
            statusDiv.textContent = 'Quay xong nhưng lỗi lưu data!';
        }

        // Hiển thị kết quả (backward compatible với string hoặc object)
        const prizeText = typeof prize === 'object' ? prize.text : prize;
        document.getElementById('winnerName').textContent = currentUserName;
        document.getElementById('prizeText').textContent = prizeText;
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
