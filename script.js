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
    { area: 'candyland', name: '糖果爆爆熊', icon: '🍭', health: 5 },
    { area: 'candyland', name: '巧克力史萊姆', icon: '🍫', health: 5 },

    { area: 'space', name: '外星果凍怪', icon: '👾', health: 5 },
    { area: 'space', name: '太空機器狗', icon: '🤖', health: 5 },

    { area: 'toyfactory', name: '失控玩具兵', icon: '🪖', health: 5 },
    { area: 'toyfactory', name: '彈簧小丑怪', icon: '🤡', health: 5 },

    { area: 'sky', name: '雷雲守護者', icon: '⚡', health: 5 },
    { area: 'sky', name: '風暴飛龍', icon: '🌪️', health: 5 },

    { area: 'ultimate_arena', name: '黃金鎧甲勇者王', icon: '🛡️', health: 5 },
    { area: 'ultimate_arena', name: '宇宙能量巨獸', icon: '💥', health: 5 }

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

    if (gameState.lastCompletedDate !== today) {
        // Reset daily quests
        Object.keys(gameState.quests).forEach(key => {
            gameState.quests[key] = false;
        });

        // Select today's monster
        selectMonster();

        saveGameState();
    } else {
        // Load current monster
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
        monsterSprite.classList.add('defeated');

        setTimeout(() => {
            showVictoryModal();
            monsterSprite.classList.remove('defeated');
        }, 1000);
    }
}

// Show victory modal
function showVictoryModal() {
    const modal = document.getElementById('victoryModal');
    const stats = document.getElementById('victoryStats');

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
    `;

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

// Start new day
function startNewDay() {
    gameState.currentLevel++;

    // Update area every 2 levels
    gameState.currentArea = Math.floor((gameState.currentLevel - 1) / 2);

    closeModals();

    // Reset quests
    Object.keys(gameState.quests).forEach(key => {
        gameState.quests[key] = false;
    });

    selectMonster();
    saveGameState();
    updateUI();

    // Reset countdown
    startCountdown();
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
    if (now.getHours() === 7 && now.getMinutes() >= 45) {
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
