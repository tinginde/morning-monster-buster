// Game State
const gameState = {
    currentLevel: 1,
    currentArea: 0,
    streak: 0,
    totalWins: 0,
    monstersDefeated: [],
    lastCompletedDate: null,
    quests: {
        dressed: false,
        breakfast: false,
        fishoil: false,
        door: false,
        toilet: false
    }
};

// Monster Data
const monsters = [
    // { area: 'forest', name: '森林哥布林', icon: '👹', health: 5 },
    // { area: 'forest', name: '樹妖精靈', icon: '🧚', health: 5 },
    // { area: 'desert', name: '沙漠蠍子王', icon: '🦂', health: 5 },
    // { area: 'desert', name: '火焰駱駝', icon: '🐫', health: 5 },
    // { area: 'ocean', name: '深海章魚怪', icon: '🐙', health: 5 },
    // { area: 'ocean', name: '鯊魚騎士', icon: '🦈', health: 5 },
    // { area: 'mountain', name: '雪山雪怪', icon: '🦍', health: 5 },
    // { area: 'mountain', name: '冰霜巨龍', icon: '🐲', health: 5 },
    // { area: 'castle', name: '暗黑騎士', icon: '⚔️', health: 5 },
    // { area: 'castle', name: '終極魔王', icon: '😈', health: 5 }
    { area: 'candyland', name: '糖果爆爆熊', nameEn: 'Candy Boom Bear', icon: '🍭', health: 5 },
    { area: 'candyland', name: '巧克力史萊姆', nameEn: 'Choco Slime', icon: '🍫', health: 5 },

    { area: 'space', name: '外星果凍怪', nameEn: 'Alien Jelly', icon: '👾', health: 5 },
    { area: 'space', name: '太空機器狗', nameEn: 'Robo Pup', icon: '🤖', health: 5 },

    { area: 'toyfactory', name: '失控玩具兵', nameEn: 'Wild Toy Soldier', icon: '🪖', health: 5 },
    { area: 'toyfactory', name: '彈簧小丑怪', nameEn: 'Spring Clown', icon: '🤡', health: 5 },

    { area: 'sky', name: '雷雲守護者', nameEn: 'Thunder Guardian', icon: '⚡', health: 5 },
    { area: 'sky', name: '風暴飛龍', nameEn: 'Storm Dragon', icon: '🌪️', health: 5 },

    { area: 'ultimate_arena', name: '黃金鎧甲勇者王', nameEn: 'Golden Armor King', icon: '🛡️', health: 5 },
    { area: 'ultimate_arena', name: '宇宙能量巨獸', nameEn: 'Cosmic Beast', icon: '💥', health: 5 }

];

let currentMonster = null;
let currentHealth = 5;
let countdownInterval = null;
let timeBonus = false;

// Initialize Game
function initGame() {
    loadGameState();
    checkNewDay();
    updateUI();
    setupEventListeners();
    startCountdown();

    // If monster is already defeated today, lock quests
    if (currentHealth <= 0) {
        lockAllQuests();
    }
}

// Load game state from localStorage
function loadGameState() {
    const saved = localStorage.getItem('earlyHeroGame');
    if (saved) {
        const savedState = JSON.parse(saved);
        Object.assign(gameState, savedState);
    }
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('earlyHeroGame', JSON.stringify(gameState));
}

// Check if it's a new day
function checkNewDay() {
    const today = new Date().toDateString();
    const lastDate = gameState.lastCompletedDate;

    // If it's a new day
    if (lastDate && lastDate !== today) {
        // Check if yesterday's monster was defeated (all quests completed or health was 0)
        const wasYesterdaySuccessful = currentHealth <= 0 ||
            Object.values(gameState.quests).every(q => q);

        // If successful yesterday, advance to next level
        if (wasYesterdaySuccessful) {
            gameState.currentLevel++;
            gameState.currentArea = Math.floor((gameState.currentLevel - 1) / 2);
        }
        // If failed, retry the same level (currentLevel stays the same)

        // Reset daily quests for new day
        Object.keys(gameState.quests).forEach(key => {
            gameState.quests[key] = false;
        });

        // Select today's monster (based on current level)
        selectMonster();

        // Unlock all quests for the new day
        unlockAllQuests();

        saveGameState();
    } else {
        // Same day - load current monster and state
        const monsterIndex = gameState.currentLevel - 1;
        currentMonster = monsters[monsterIndex % monsters.length];

        // Calculate current health based on completed quests
        const completedCount = Object.values(gameState.quests).filter(q => q).length;
        currentHealth = currentMonster.health - completedCount;
    }
}

// Select monster based on current level
function selectMonster() {
    const monsterIndex = (gameState.currentLevel - 1) % monsters.length;
    currentMonster = monsters[monsterIndex];
    currentHealth = currentMonster.health;

    // Update area
    gameState.currentArea = Math.floor((gameState.currentLevel - 1) / 2);
}

// Update UI
function updateUI() {
    // Update stats
    document.getElementById('currentLevel').textContent = gameState.currentLevel;
    document.getElementById('streak').textContent = gameState.streak;
    document.getElementById('totalWins').textContent = gameState.totalWins;

    // Update monster
    document.getElementById('monsterIcon').textContent = currentMonster.icon;
    document.getElementById('monsterName').textContent = currentMonster.name;
    document.getElementById('monsterNameEn').textContent = currentMonster.nameEn;
    updateHealthBar();

    // Update map
    updateMap();

    // Update quests
    updateQuests();
}

// Update health bar
function updateHealthBar() {
    const percentage = (currentHealth / currentMonster.health) * 100;
    document.getElementById('healthFill').style.width = percentage + '%';
    document.getElementById('healthText').textContent = `${currentHealth}/${currentMonster.health}`;
}

// Update map progress
function updateMap() {
    const nodes = document.querySelectorAll('.map-node');
    const heroMarker = document.getElementById('heroMarker');

    nodes.forEach((node, index) => {
        node.classList.remove('unlocked', 'current');
        if (index < gameState.currentArea) {
            node.classList.add('unlocked');
        } else if (index === gameState.currentArea) {
            node.classList.add('current');
        }
    });

    // Position hero marker
    if (nodes[gameState.currentArea]) {
        const currentNode = nodes[gameState.currentArea];
        const nodeRect = currentNode.getBoundingClientRect();
        const trackRect = currentNode.parentElement.getBoundingClientRect();
        const leftPosition = nodeRect.left - trackRect.left + (nodeRect.width / 2) - 16;
        heroMarker.style.left = leftPosition + 'px';
    }
}

// Update quest checkboxes
function updateQuests() {
    Object.keys(gameState.quests).forEach(questId => {
        const checkbox = document.getElementById(`quest-${questId}`);
        const questItem = checkbox.closest('.quest-item');

        checkbox.checked = gameState.quests[questId];

        if (gameState.quests[questId]) {
            questItem.classList.add('completed');
        } else {
            questItem.classList.remove('completed');
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Quest checkboxes
    Object.keys(gameState.quests).forEach(questId => {
        const checkbox = document.getElementById(`quest-${questId}`);
        checkbox.addEventListener('change', (e) => handleQuestComplete(questId, e.target.checked));
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetGame);

    // Next day button
    document.getElementById('nextDayBtn').addEventListener('click', startNewDay);

    // Retry button
    document.getElementById('retryBtn').addEventListener('click', closeModals);
}

// Handle quest completion
function handleQuestComplete(questId, isChecked) {
    gameState.quests[questId] = isChecked;

    const questItem = document.querySelector(`[data-quest="${questId}"]`);

    if (isChecked) {
        // Attack animation
        questItem.classList.add('attack');
        setTimeout(() => questItem.classList.remove('attack'), 500);

        // Damage monster
        attackMonster(questId === 'door' && timeBonus ? 2 : 1);

        questItem.classList.add('completed');
    } else {
        // Heal monster if unchecked
        currentHealth = Math.min(currentHealth + 1, currentMonster.health);
        updateHealthBar();
        questItem.classList.remove('completed');
    }

    saveGameState();
    checkVictory();
}

// Attack monster
function attackMonster(damage = 1) {
    const monsterSprite = document.getElementById('monsterSprite');
    const damageNumbers = document.getElementById('damageNumbers');

    // Shake animation
    monsterSprite.classList.add('shake');
    setTimeout(() => monsterSprite.classList.remove('shake'), 500);

    // Show damage number
    const damageEl = document.createElement('div');
    damageEl.className = 'damage-number';
    damageEl.textContent = `-${damage}`;
    damageNumbers.appendChild(damageEl);

    setTimeout(() => damageEl.remove(), 1000);

    // Reduce health
    currentHealth = Math.max(0, currentHealth - damage);
    updateHealthBar();
}

// Check victory condition
function checkVictory() {
    if (currentHealth <= 0) {
        // Victory!
        const monsterSprite = document.getElementById('monsterSprite');

        // Lock all quests (disable checkboxes)
        lockAllQuests();

        // Add defeat special effects
        createDefeatEffects();

        // Add defeated class for animation
        monsterSprite.classList.add('defeated');

        setTimeout(() => {
            showVictoryModal();
            monsterSprite.classList.remove('defeated');
            clearDefeatEffects();
        }, 1000);
    }
}

// Lock all quest checkboxes
function lockAllQuests() {
    Object.keys(gameState.quests).forEach(questId => {
        const checkbox = document.getElementById(`quest-${questId}`);
        checkbox.disabled = true;
    });
}

// Unlock all quest checkboxes
function unlockAllQuests() {
    Object.keys(gameState.quests).forEach(questId => {
        const checkbox = document.getElementById(`quest-${questId}`);
        checkbox.disabled = false;
    });
}

// Create defeat special effects
function createDefeatEffects() {
    const effectsContainer = document.getElementById('defeatEffects');

    // Clear any existing effects
    effectsContainer.innerHTML = '';

    // Create flash effect
    const flash = document.createElement('div');
    flash.className = 'flash-effect';
    effectsContainer.appendChild(flash);

    // Create colorful particles
    const colors = ['#7f5af0', '#ff006e', '#72ddf7', '#ffd23f', '#06ffa5'];
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];

        // Random direction
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 100 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.animationDelay = `${Math.random() * 0.1}s`;

        effectsContainer.appendChild(particle);
    }

    // Create star particles
    const stars = ['⭐', '✨', '💫', '🌟'];
    const starCount = 8;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star-particle';
        star.textContent = stars[Math.floor(Math.random() * stars.length)];

        const angle = (Math.PI * 2 * i) / starCount;
        const distance = 80 + Math.random() * 40;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        star.style.setProperty('--tx', `${tx}px`);
        star.style.setProperty('--ty', `${ty}px`);
        star.style.animationDelay = `${Math.random() * 0.2}s`;

        effectsContainer.appendChild(star);
    }
}

// Clear defeat effects
function clearDefeatEffects() {
    const effectsContainer = document.getElementById('defeatEffects');
    effectsContainer.innerHTML = '';
}

// Show victory modal
function showVictoryModal() {
    const modal = document.getElementById('victoryModal');
    const stats = document.getElementById('victoryStats');
    const nextDayBtn = document.getElementById('nextDayBtn');

    // Update stats
    gameState.totalWins++;
    gameState.streak++;
    gameState.lastCompletedDate = new Date().toDateString();

    // Check if unlocking new area
    const unlockMessage = gameState.streak % 7 === 0 ?
        '🎊 解鎖新地圖區域！' : '';

    stats.innerHTML = `
        <p>🏆 連續 ${gameState.streak} 天成功！</p>
        <p>⭐ 總共打敗 ${gameState.totalWins} 隻怪獸</p>
        ${unlockMessage ? `<p style="color: var(--accent-yellow); font-weight: 900;">${unlockMessage}</p>` : ''}
        <p style="margin-top: 1rem; color: var(--accent-cyan); font-size: 0.95rem;">✨ 今天的任務完成了！明天見！</p>
    `;

    // Change button text to close
    nextDayBtn.textContent = '太棒了！ →';

    saveGameState();
    modal.classList.add('active');
}

// Show defeat modal
function showDefeatModal() {
    const modal = document.getElementById('defeatModal');

    // Reset streak
    gameState.streak = 0;
    gameState.lastCompletedDate = new Date().toDateString();

    saveGameState();
    modal.classList.add('active');
}

// Start new day (now just closes the modal)
function startNewDay() {
    // Just close the modal - the real new day will be handled by checkNewDay()
    closeModals();
}

// Close all modals
function closeModals() {
    document.getElementById('victoryModal').classList.remove('active');
    document.getElementById('defeatModal').classList.remove('active');
}

// Countdown timer for 7:45 deadline
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
}

function updateCountdown() {
    const now = new Date();
    const target = new Date();
    target.setHours(7, 45, 0, 0);

    // If past 7:45, set target to tomorrow
    if (now > target) {
        target.setDate(target.getDate() + 1);
    }

    const diff = target - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const countdownTimer = document.getElementById('countdownTimer');
    const timeWarning = document.getElementById('timeWarning');
    const timeBonusEl = document.getElementById('timeBonus');

    // Format time
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    countdownTimer.textContent = timeString;

    // Show warning if within 30 minutes
    if (diff < 30 * 60 * 1000 && diff > 0) {
        timeWarning.classList.add('active');
    } else {
        timeWarning.classList.remove('active');
    }

    // Time bonus if before 7:30
    const earlyTarget = new Date();
    earlyTarget.setHours(7, 30, 0, 0);

    if (now < earlyTarget) {
        timeBonus = true;
        timeBonusEl.classList.add('active');
    } else {
        timeBonus = false;
        timeBonusEl.classList.remove('active');
    }

    // Check if past deadline and not all quests completed
    if (now.getHours() === 7 && now.getMinutes() >= 46) {
        const doorQuest = gameState.quests.door;
        if (!doorQuest && currentHealth > 0) {
            // Monster counterattack!
            const today = new Date().toDateString();
            if (gameState.lastCompletedDate !== today) {
                showDefeatModal();
                clearInterval(countdownInterval);
            }
        }
    }
}

// Reset game (for testing)
function resetGame() {
    if (confirm('確定要重置所有進度嗎？')) {
        localStorage.removeItem('earlyHeroGame');
        location.reload();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
