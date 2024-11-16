// 状态管理
const state = {
    images: [],
    currentIndex: 0,
    currentMode: 'sequential',
    currentHintCount: 0,
    stats: {
        total: 0,
        correct: 0,
        attempts: 0,
        currentStreak: 0,
        bestStreak: 0
    }
};

// DOM Elements
const elements = {
    folderInput: document.getElementById('folderInput'),
    imageContainer: document.getElementById('imageContainer'),
    answerInput: document.getElementById('answerInput'),
    checkAnswerBtn: document.getElementById('checkAnswer'),
    nextImageBtn: document.getElementById('nextImage'),
    hintButton: document.getElementById('hintButton'),
    hintText: document.getElementById('hintText'),
    sequentialModeBtn: document.getElementById('sequentialMode'),
    randomModeBtn: document.getElementById('randomMode'),
    totalImagesEl: document.getElementById('totalImages'),
    scoreEl: document.getElementById('score'),
    answerResult: document.getElementById('answerResult'),
    autoNext: document.getElementById('autoNext'),
    streakEl: document.getElementById('streak'),
    bestStreakEl: document.getElementById('bestStreak')
};

// Event Listeners
elements.folderInput.addEventListener('change', handleFolderSelect);
elements.checkAnswerBtn.addEventListener('click', checkAnswer);
elements.nextImageBtn.addEventListener('click', showNextImage);
elements.hintButton.addEventListener('click', showHint);
elements.sequentialModeBtn.addEventListener('click', () => setMode('sequential'));
elements.randomModeBtn.addEventListener('click', () => setMode('random'));
elements.answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

// 文件处理
function handleFolderSelect(event) {
    const files = Array.from(event.target.files).filter(file => {
        const isImage = file.type.startsWith('image/');
        const hasValidName = file.name.split('.')[0].trim().length > 0;
        return isImage && hasValidName;
    });
    
    if (files.length === 0) {
        showResult('请选择包含有效图片的文件夹（图片名不能为空）', 'error');
        return;
    }

    state.images = files.map(file => ({
        file,
        name: file.name.split('.')[0],
        attempts: 0,
        correct: 0
    }));
    
    resetStats();
    enableInterface();
    showCurrentImage();
}

// 图片显示
function showCurrentImage() {
    if (state.images.length === 0) return;

    const image = state.images[state.currentIndex];
    const reader = new FileReader();
    
    elements.imageContainer.innerHTML = '<div class="animate-pulse bg-gray-300 w-full h-full rounded-lg"></div>';
    
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            elements.imageContainer.innerHTML = '';
            img.className = 'max-h-full max-w-full object-contain rounded-lg transition-opacity duration-300';
            elements.imageContainer.appendChild(img);
        };
        img.src = e.target.result;
    };
    
    reader.onerror = () => {
        showResult('图片加载失败，请重试', 'error');
    };
    
    reader.readAsDataURL(image.file);
    resetInputState();
}

// 提示功能
function showHint() {
    const currentImage = state.images[state.currentIndex];
    const name = currentImage.name;
    state.currentHintCount++;
    
    if (state.currentHintCount <= name.length) {
        const revealedPart = name.substring(0, state.currentHintCount);
        const hiddenPart = '*'.repeat(name.length - state.currentHintCount);
        elements.hintText.textContent = `提示：${revealedPart}${hiddenPart}`;
        
        // 使用提示会影响得分
        state.stats.attempts++;
        updateStats();
    }
}

// 答案检查
function checkAnswer() {
    if (!elements.answerInput.value.trim()) {
        showResult('请输入答案', 'error');
        return;
    }

    const currentImage = state.images[state.currentIndex];
    const userAnswer = elements.answerInput.value.trim().toLowerCase();
    const correctAnswer = currentImage.name.toLowerCase();
    
    currentImage.attempts++;
    state.stats.attempts++;
    
    if (userAnswer === correctAnswer) {
        currentImage.correct++;
        state.stats.correct++;
        state.stats.currentStreak++;
        state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.currentStreak);
        showResult('✅ 回答正确！', 'success');
        
        if (elements.autoNext.checked) {
            setTimeout(showNextImage, 500);
        }
    } else {
        state.stats.currentStreak = 0;
        showResult('❌ 回答错误，请重试！', 'error');
    }
    
    updateStats();
}

// 下一张图片
function showNextImage() {
    if (state.currentMode === 'sequential') {
        state.currentIndex = (state.currentIndex + 1) % state.images.length;
    } else {
        const previousIndex = state.currentIndex;
        do {
            state.currentIndex = Math.floor(Math.random() * state.images.length);
        } while (state.images.length > 1 && state.currentIndex === previousIndex);
    }
    showCurrentImage();
}

// 模式设置
function setMode(mode) {
    state.currentMode = mode;
    state.currentIndex = 0;
    resetStats();
    
    if (mode === 'sequential') {
        elements.sequentialModeBtn.classList.add('bg-blue-600');
        elements.randomModeBtn.classList.remove('bg-green-600');
    } else {
        elements.sequentialModeBtn.classList.remove('bg-blue-600');
        elements.randomModeBtn.classList.add('bg-green-600');
    }
    
    if (state.images.length > 0) {
        showCurrentImage();
    }
}

// 统计更新
function updateStats() {
    elements.totalImagesEl.textContent = state.stats.total;
    const score = state.stats.attempts > 0 
        ? Math.round((state.stats.correct / state.stats.attempts) * 100) 
        : 0;
    elements.scoreEl.textContent = `${score}%`;
    elements.streakEl.textContent = state.stats.currentStreak;
    elements.bestStreakEl.textContent = state.stats.bestStreak;
}

// 界面状态
function enableInterface() {
    elements.answerInput.disabled = false;
    elements.checkAnswerBtn.disabled = false;
    elements.nextImageBtn.disabled = false;
    elements.hintButton.disabled = false;
}

// 重置输入状态
function resetInputState() {
    elements.answerInput.value = '';
    elements.hintText.textContent = '';
    elements.answerResult.textContent = '';
    elements.answerResult.className = 'text-center text-lg font-bold min-h-[1.5rem]';
    state.currentHintCount = 0;
    elements.answerInput.focus();
}

// 重置统计
function resetStats() {
    state.stats = {
        total: state.images.length,
        correct: 0,
        attempts: 0,
        currentStreak: 0,
        bestStreak: 0
    };
    updateStats();
}

// 显示结果
function showResult(message, type) {
    elements.answerResult.textContent = message;
    elements.answerResult.className = `text-center text-lg font-bold min-h-[1.5rem] ${
        type === 'success' ? 'text-green-600' : 'text-red-600'
    }`;
}