document.addEventListener('DOMContentLoaded', () => {
    // Game state variables
    let gameActive = true;
    let currentPlayer = 'x';
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let scores = { x: 0, o: 0 };
    let gameMode = 'pvp'; // Player vs Player by default
    let difficulty = 'medium'; // Medium difficulty by default
    let soundEnabled = true; // Sound enabled by default
    let soundVolume = 0.7; // Default volume (0.0 to 1.0)
    let autoRestartEnabled = true; // Auto restart enabled by default
    let gameHistory = []; // Array to store game history
    let autoRestartTimeout = null; // Timeout for auto restart

    // Winning streak tracking
    let winStreaks = { x: 0, o: 0 }; // Track consecutive wins
    let lastWinner = null; // Track the last winner

    // Personalization variables
    let playerNames = { x: 'Player X', o: 'Player O' };
    let playerMarkers = { x: 'X', o: 'O' };
    let currentTheme = 'default';
    let boardSize = 3; // 3x3 board by default

    // DOM elements
    const statusDisplay = document.getElementById('status');
    const resetButton = document.getElementById('reset-btn');
    let cells = document.querySelectorAll('.cell');
    const scoreX = document.getElementById('score-x');
    const scoreO = document.getElementById('score-o');
    const gameModeSelect = document.getElementById('game-mode');
    const difficultySelect = document.getElementById('difficulty');
    const difficultyContainer = document.getElementById('difficulty-container');
    const autoRestartToggle = document.getElementById('auto-restart');
    const themeToggle = document.getElementById('theme-toggle');
    const soundToggle = document.getElementById('sound-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    const playerOLabel = document.getElementById('player-o-label');
    const historyList = document.getElementById('history-list');
    const clearHistoryButton = document.getElementById('clear-history');

    // Personalization modal elements
    const personalizeBtn = document.getElementById('personalize-btn');
    const personalizeModal = document.getElementById('personalize-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const savePersonalizationBtn = document.getElementById('save-personalization');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Player names inputs
    const playerXNameInput = document.getElementById('player-x-name');
    const playerONameInput = document.getElementById('player-o-name');

    // Marker options
    const xMarkerOptions = document.querySelectorAll('#x-marker-options .marker-option');
    const oMarkerOptions = document.querySelectorAll('#o-marker-options .marker-option');

    // Theme options
    const themeOptions = document.querySelectorAll('.theme-option');

    // Board size options
    const boardSizeOptions = document.querySelectorAll('.board-size-option');
    const board = document.getElementById('board');

    // Sound elements
    const moveSound = document.getElementById('move-sound');

    // Win sounds
    const winSound = document.getElementById('win-sound');
    const winStreakSound = document.getElementById('win-streak-sound');
    const winFanfareSound = document.getElementById('win-fanfare-sound');

    // Fail/Draw sounds
    const drawSound = document.getElementById('draw-sound');
    const failSound = document.getElementById('fail-sound');

    // Other game sounds
    const countdownSound = document.getElementById('countdown-sound');
    const restartSound = document.getElementById('restart-sound');

    // Winning combinations
    const winningConditions = [
        [0, 1, 2], // Top row
        [3, 4, 5], // Middle row
        [6, 7, 8], // Bottom row
        [0, 3, 6], // Left column
        [1, 4, 7], // Middle column
        [2, 5, 8], // Right column
        [0, 4, 8], // Diagonal top-left to bottom-right
        [2, 4, 6]  // Diagonal top-right to bottom-left
    ];

    // Messages
    const winningMessage = () => {
        if (gameMode === 'pvc' && currentPlayer === 'o') {
            return `Computer wins!`;
        }
        return `${playerNames[currentPlayer]} wins!`;
    };
    const drawMessage = () => `Game ended in a draw!`;
    const currentPlayerTurn = () => {
        if (gameMode === 'pvc' && currentPlayer === 'o') {
            return `Computer's turn`;
        }
        return `${playerNames[currentPlayer]}'s turn`;
    };

    // Load saved data from local storage
    function loadFromLocalStorage() {
        // Load scores
        const savedScores = localStorage.getItem('ticTacToeScores');
        if (savedScores) {
            scores = JSON.parse(savedScores);
            updateScoreDisplay();
        }

        // Load settings
        const savedSettings = localStorage.getItem('ticTacToeSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            gameMode = settings.gameMode || 'pvp';
            difficulty = settings.difficulty || 'medium';
            soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
            soundVolume = settings.soundVolume !== undefined ? settings.soundVolume : 0.7;

            // Ensure auto-restart is properly initialized
            autoRestartEnabled = settings.autoRestartEnabled !== undefined ? settings.autoRestartEnabled : true;
            console.log("Auto-restart loaded from storage:", autoRestartEnabled);

            // Load personalization settings
            if (settings.playerNames) playerNames = settings.playerNames;
            if (settings.playerMarkers) playerMarkers = settings.playerMarkers;
            if (settings.theme) currentTheme = settings.theme;
            if (settings.boardSize) boardSize = settings.boardSize;

            // Apply settings to UI
            gameModeSelect.value = gameMode;
            difficultySelect.value = difficulty;
            autoRestartToggle.checked = autoRestartEnabled;
            volumeSlider.value = Math.round(soundVolume * 100);
            updateDifficultyVisibility();
            updatePlayerLabels();

            // Apply sound setting
            if (!soundEnabled) {
                soundToggle.classList.remove('sound-on');
                soundToggle.classList.add('sound-off');
                soundToggle.querySelector('i').className = 'fas fa-volume-mute';
            }

            // Apply theme setting
            applyTheme(currentTheme);

            // Apply personalization settings to modal
            playerXNameInput.value = playerNames.x;
            playerONameInput.value = playerNames.o;

            // Select the correct marker options
            xMarkerOptions.forEach(option => {
                if (option.dataset.marker === playerMarkers.x) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });

            oMarkerOptions.forEach(option => {
                if (option.dataset.marker === playerMarkers.o) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });

            // Select the correct theme option
            themeOptions.forEach(option => {
                if (option.dataset.theme === currentTheme) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });

            // Select the correct board size option
            boardSizeOptions.forEach(option => {
                if (parseInt(option.dataset.size) === boardSize) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });

            // Apply board size
            updateBoardSize();
        }

        // Load game history
        const savedHistory = localStorage.getItem('ticTacToeHistory');
        if (savedHistory) {
            gameHistory = JSON.parse(savedHistory);
            renderGameHistory();
        }
    }

    // Save data to local storage
    function saveToLocalStorage() {
        // Save scores
        localStorage.setItem('ticTacToeScores', JSON.stringify(scores));

        // Ensure auto-restart toggle state is correctly read
        autoRestartEnabled = autoRestartToggle.checked;

        // Save settings
        const settings = {
            gameMode,
            difficulty,
            soundEnabled,
            soundVolume,
            autoRestartEnabled,
            playerNames,
            playerMarkers,
            theme: currentTheme,
            boardSize
        };

        console.log("Saving settings with autoRestartEnabled:", autoRestartEnabled);
        localStorage.setItem('ticTacToeSettings', JSON.stringify(settings));

        // Save game history (limit to last 10 games)
        if (gameHistory.length > 10) {
            gameHistory = gameHistory.slice(-10);
        }
        localStorage.setItem('ticTacToeHistory', JSON.stringify(gameHistory));
    }

    // Set initial status message
    statusDisplay.textContent = currentPlayerTurn();

    // Handle cell click
    function handleCellClick(clickedCellEvent) {
        // Get clicked cell
        const clickedCell = clickedCellEvent.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));

        // Check if cell is already played or game is inactive
        if (gameState[clickedCellIndex] !== '' || !gameActive) {
            return;
        }

        // Check if it's computer's turn in PvC mode
        if (gameMode === 'pvc' && currentPlayer === 'o') {
            return;
        }

        // Update game state and UI
        handleCellPlayed(clickedCell, clickedCellIndex);

        // Play move sound
        playSound(moveSound);

        // Check for win or draw
        handleResultValidation();

        // If game is still active and it's computer's turn, make computer move
        if (gameActive && gameMode === 'pvc' && currentPlayer === 'o') {
            // Add a slight delay for better UX
            setTimeout(() => {
                makeComputerMove();
            }, 500);
        }
    }

    // Update cell and game state
    function handleCellPlayed(clickedCell, clickedCellIndex) {
        // Update internal game state
        gameState[clickedCellIndex] = currentPlayer;

        // Update UI based on whether we're using custom markers
        if (playerMarkers[currentPlayer] === 'X' || playerMarkers[currentPlayer] === 'O') {
            // Using default X/O
            clickedCell.classList.add(currentPlayer);
            clickedCell.classList.remove('custom-x', 'custom-o');
            clickedCell.removeAttribute('data-custom-marker');
        } else {
            // Using custom marker
            clickedCell.classList.add(`custom-${currentPlayer}`);
            clickedCell.classList.remove('x', 'o');
            clickedCell.setAttribute('data-custom-marker', playerMarkers[currentPlayer]);
        }
    }

    // Computer move based on difficulty
    function makeComputerMove() {
        if (!gameActive) return;

        let cellIndex;

        switch (difficulty) {
            case 'easy':
                cellIndex = makeRandomMove();
                break;
            case 'hard':
                cellIndex = makeBestMove();
                break;
            case 'medium':
            default:
                // 50% chance of making the best move, 50% chance of making a random move
                cellIndex = Math.random() > 0.5 ? makeBestMove() : makeRandomMove();
                break;
        }

        const cell = document.querySelector(`[data-cell-index="${cellIndex}"]`);
        handleCellPlayed(cell, cellIndex);

        // Play move sound
        playSound(moveSound);

        // Check for win or draw
        handleResultValidation();
    }

    // Make a random valid move
    function makeRandomMove() {
        const emptyCells = gameState
            .map((cell, index) => cell === '' ? index : null)
            .filter(index => index !== null);

        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // Make the best move using minimax algorithm
    function makeBestMove() {
        let bestScore = -Infinity;
        let bestMove;

        // Try each available move
        for (let i = 0; i < gameState.length; i++) {
            if (gameState[i] === '') {
                // Make the move
                gameState[i] = 'o';

                // Calculate score for this move
                const score = minimax(gameState, 0, false);

                // Undo the move
                gameState[i] = '';

                // Update best move if this is better
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    // Minimax algorithm for AI
    function minimax(board, depth, isMaximizing) {
        // Check for terminal states
        const result = checkWinner(board);

        if (result !== null) {
            if (result === 'o') return 10 - depth; // Computer wins
            if (result === 'x') return depth - 10; // Human wins
            if (result === 'draw') return 0; // Draw
        }

        if (isMaximizing) {
            // Computer's turn (maximize score)
            let bestScore = -Infinity;

            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'o';
                    const score = minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }

            return bestScore;
        } else {
            // Human's turn (minimize score)
            let bestScore = Infinity;

            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'x';
                    const score = minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }

            return bestScore;
        }
    }

    // Check winner for minimax (doesn't modify game state)
    function checkWinner(board) {
        // Check for win
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a]; // Return 'x' or 'o'
            }
        }

        // Check for draw
        if (!board.includes('')) {
            return 'draw';
        }

        // Game still in progress
        return null;
    }

    // Check if current player has won or if it's a draw
    function handleResultValidation() {
        let roundWon = false;
        let winningCombination = [];

        // Check all winning combinations
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            const condition = gameState[a] === gameState[b] &&
                              gameState[b] === gameState[c] &&
                              gameState[a] !== '';

            if (condition) {
                roundWon = true;
                winningCombination = [a, b, c];
                break;
            }
        }

        // Handle win
        if (roundWon) {
            statusDisplay.textContent = winningMessage();
            gameActive = false;

            // Highlight winning cells
            winningCombination.forEach(index => {
                document.querySelector(`[data-cell-index="${index}"]`).classList.add('winner');
            });

            // Update score
            scores[currentPlayer]++;
            updateScoreDisplay();

            // Update winning streak
            if (lastWinner === currentPlayer) {
                winStreaks[currentPlayer]++;
            } else {
                // Reset streak for this player
                winStreaks[currentPlayer] = 1;
            }

            // Update last winner
            lastWinner = currentPlayer;

            // Play appropriate win sound based on streak
            if (winStreaks[currentPlayer] >= 3) {
                // Play special fanfare for 3+ win streak
                playSoundSequence([winStreakSound, winFanfareSound], [300]);
            } else if (winStreaks[currentPlayer] === 2) {
                // Play streak sound for 2 wins in a row
                playSound(winStreakSound, 1.2);
            } else {
                // Play regular win sound
                playSound(winSound);
            }

            // Add to game history
            addGameToHistory(currentPlayer, 'win');

            // Save to local storage
            saveToLocalStorage();

            // Schedule auto restart if enabled
            scheduleAutoRestart();

            return 'win';
        }

        // Handle draw
        const roundDraw = !gameState.includes('');
        if (roundDraw) {
            statusDisplay.textContent = drawMessage();
            gameActive = false;

            // Reset winning streaks on draw
            lastWinner = null;

            // Play draw sound - alternate between two different sounds
            if (Math.random() > 0.5) {
                playSound(drawSound, 0.9);
            } else {
                playSound(failSound, 0.8);
            }

            // Add to game history
            addGameToHistory(null, 'draw');

            // Save to local storage
            saveToLocalStorage();

            // Schedule auto restart if enabled
            scheduleAutoRestart();

            return 'draw';
        }

        // If no win or draw, switch player
        handlePlayerChange();
        return null;
    }

    // Switch current player
    function handlePlayerChange() {
        currentPlayer = currentPlayer === 'x' ? 'o' : 'x';
        statusDisplay.textContent = currentPlayerTurn();
    }

    // Update score display
    function updateScoreDisplay() {
        // Update score text
        scoreX.textContent = scores.x;
        scoreO.textContent = scores.o;

        // Get parent elements
        const scoreXParent = scoreX.parentElement;
        const scoreOParent = scoreO.parentElement;

        // Remove all streak classes
        scoreXParent.classList.remove('streak-2', 'streak-3', 'streak-4', 'streak-active');
        scoreOParent.classList.remove('streak-2', 'streak-3', 'streak-4', 'streak-active');

        // Add streak classes based on current streaks
        if (winStreaks.x >= 2) {
            const streakClass = winStreaks.x > 4 ? 'streak-4' : `streak-${winStreaks.x}`;
            scoreXParent.classList.add(streakClass);

            // Add animation class if this is a new win
            if (lastWinner === 'x') {
                scoreXParent.classList.add('streak-active');
            }
        }

        if (winStreaks.o >= 2) {
            const streakClass = winStreaks.o > 4 ? 'streak-4' : `streak-${winStreaks.o}`;
            scoreOParent.classList.add(streakClass);

            // Add animation class if this is a new win
            if (lastWinner === 'o') {
                scoreOParent.classList.add('streak-active');
            }
        }
    }

    // Reset the game
    function handleReset() {
        console.log("Reset button clicked - handleReset called");

        // Clear any pending auto-restart
        if (autoRestartTimeout) {
            clearTimeout(autoRestartTimeout);
            autoRestartTimeout = null;
        }

        // Check if this is a manual reset (not auto-restart)
        const isManualReset = !autoRestartEnabled || !gameActive;

        // Play restart sound if game was in progress or finished
        // (Don't play when just initializing the game)
        if (gameState.some(cell => cell !== '')) {
            playSound(restartSound, 0.8);
        }

        // If it's a manual reset, reset winning streaks
        if (isManualReset) {
            winStreaks = { x: 0, o: 0 };
            lastWinner = null;
        }

        // Reset game state
        gameActive = true;
        currentPlayer = 'x';

        // Create a new game state array based on board size
        gameState = Array(boardSize * boardSize).fill('');

        // Remove countdown highlight if present
        statusDisplay.classList.remove('countdown');
        statusDisplay.textContent = currentPlayerTurn();

        // Make sure we have the latest cells reference
        cells = document.querySelectorAll('.cell');
        console.log(`Found ${cells.length} cells to reset`);

        // Reset cell UI - use a more thorough approach
        cells.forEach(cell => {
            // Remove all possible classes
            cell.className = 'cell';

            // Remove any custom marker
            cell.removeAttribute('data-custom-marker');

            // Log the reset for debugging
            console.log(`Reset cell ${cell.getAttribute('data-cell-index')}`);
        });

        console.log("Game reset complete");

        // Debug game state after reset
        debugGameState();
    }

    // Schedule auto restart
    function scheduleAutoRestart() {
        console.log("scheduleAutoRestart called, autoRestartEnabled:", autoRestartEnabled);

        // Clear any existing auto-restart timeout to prevent conflicts
        if (autoRestartTimeout) {
            clearTimeout(autoRestartTimeout);
            autoRestartTimeout = null;
        }

        if (autoRestartEnabled) {
            // Show countdown in status with highlight
            let countdown = 3;
            statusDisplay.textContent = `New game starting in ${countdown}...`;
            statusDisplay.classList.add('countdown');

            // Play initial countdown sound
            playSound(countdownSound, 0.7);

            // Create a variable to store the interval ID
            let countdownInterval;

            // Set the countdown interval
            countdownInterval = setInterval(() => {
                countdown--;
                console.log("Countdown:", countdown);

                if (countdown > 0) {
                    // Update status display
                    statusDisplay.textContent = `New game starting in ${countdown}...`;

                    // Play countdown sound for each second
                    playSound(countdownSound, 0.7);
                } else {
                    // Clear the interval when countdown reaches 0
                    clearInterval(countdownInterval);
                }
            }, 1000);

            // Set timeout to restart the game
            autoRestartTimeout = setTimeout(() => {
                console.log("Auto-restart timeout triggered");

                // Clear the interval if it's still running
                if (countdownInterval) {
                    clearInterval(countdownInterval);
                }

                // Play restart sound
                playSound(restartSound, 0.8);

                // Reset the game
                handleReset();

                // Clear the timeout reference
                autoRestartTimeout = null;

                // Remove countdown highlight
                statusDisplay.classList.remove('countdown');

                console.log("Auto-restart complete");
            }, 3000); // 3 seconds delay

            console.log("Auto-restart scheduled");
        } else {
            console.log("Auto-restart is disabled, not scheduling");
        }
    }

    // Play sound if enabled
    function playSound(sound, volumeMultiplier = 1.0) {
        if (soundEnabled) {
            // Reset the sound to the beginning
            sound.currentTime = 0;

            // Set volume (0.0 to 1.0) using global volume setting and multiplier
            // The multiplier allows for relative volume adjustments for different sounds
            sound.volume = Math.min(soundVolume * volumeMultiplier, 1.0);

            // Play the sound with error handling
            sound.play().catch(e => console.log("Error playing sound:", e));

            // Return a promise that resolves when the sound finishes playing
            return new Promise((resolve) => {
                sound.onended = resolve;
            });
        }
        // If sound is disabled, return a resolved promise
        return Promise.resolve();
    }

    // Play a sequence of sounds with delays
    async function playSoundSequence(sounds, delays = []) {
        if (!soundEnabled) return Promise.resolve();

        for (let i = 0; i < sounds.length; i++) {
            // Play the current sound
            await playSound(sounds[i]);

            // If there's a delay specified for after this sound, wait
            if (delays[i]) {
                await new Promise(resolve => setTimeout(resolve, delays[i]));
            }
        }
    }

    // Update difficulty visibility based on game mode
    function updateDifficultyVisibility() {
        if (gameMode === 'pvc') {
            difficultyContainer.style.display = 'flex';
        } else {
            difficultyContainer.style.display = 'none';
        }
    }

    // Update player labels based on game mode and custom names
    function updatePlayerLabels() {
        const playerXLabel = document.querySelector('.score:first-child .player');

        // Update X player label
        playerXLabel.textContent = playerNames.x;

        // Update O player label based on game mode
        if (gameMode === 'pvc') {
            playerOLabel.textContent = 'Computer';
        } else {
            playerOLabel.textContent = playerNames.o;
        }
    }

    // Add game to history
    function addGameToHistory(winner, result) {
        const timestamp = new Date().toLocaleString();
        const historyItem = {
            timestamp,
            result,
            winner,
            gameMode,
            difficulty: gameMode === 'pvc' ? difficulty : null,
            playerNames: {...playerNames} // Save current player names
        };

        gameHistory.unshift(historyItem); // Add to beginning of array
        renderGameHistory();
    }

    // Render game history
    function renderGameHistory() {
        historyList.innerHTML = '';

        if (gameHistory.length === 0) {
            historyList.innerHTML = '<div class="history-item">No games played yet</div>';
            return;
        }

        gameHistory.forEach(game => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            let resultText = '';
            if (game.result === 'win') {
                let winnerText;
                if (game.gameMode === 'pvc' && game.winner === 'o') {
                    winnerText = 'Computer';
                } else if (game.playerNames && game.playerNames[game.winner]) {
                    // Use saved player name if available
                    winnerText = game.playerNames[game.winner];
                } else {
                    // Fallback to default
                    winnerText = `Player ${game.winner.toUpperCase()}`;
                }
                resultText = `<span class="winner">${winnerText} won</span>`;
            } else {
                resultText = 'Game ended in a draw';
            }

            const modeText = game.gameMode === 'pvc'
                ? `Player vs Computer (${game.difficulty})`
                : 'Player vs Player';

            historyItem.innerHTML = `
                ${resultText} - ${modeText}
                <span class="timestamp">${game.timestamp}</span>
            `;

            historyList.appendChild(historyItem);
        });
    }

    // Apply theme
    function applyTheme(theme) {
        // Remove all theme classes
        document.body.classList.remove('dark-theme', 'neon-theme', 'pastel-theme', 'retro-theme', 'ocean-theme');

        // Add the selected theme class if it's not the default
        if (theme !== 'default') {
            document.body.classList.add(`${theme}-theme`);
        }

        // Update theme toggle icon
        if (theme === 'default') {
            themeToggle.querySelector('i').className = 'fas fa-moon';
        } else {
            themeToggle.querySelector('i').className = 'fas fa-sun';
        }
    }

    // Toggle between light and dark themes
    function toggleTheme() {
        // If we're using a custom theme, go back to default
        if (currentTheme !== 'default' && currentTheme !== 'dark') {
            currentTheme = 'default';
        }
        // If we're using default, switch to dark
        else if (currentTheme === 'default') {
            currentTheme = 'dark';
        }
        // If we're using dark, switch to default
        else {
            currentTheme = 'default';
        }

        // Apply the theme
        applyTheme(currentTheme);

        // Save to local storage
        saveToLocalStorage();
    }

    // Update board size
    function updateBoardSize() {
        console.log(`Updating board size to ${boardSize}x${boardSize}`);

        // Clear the current board
        board.innerHTML = '';

        // Create a new game state array based on board size
        gameState = Array(boardSize * boardSize).fill('');

        // Update the board CSS to show the correct grid
        board.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;

        // Set the data-size attribute for responsive styling
        board.setAttribute('data-size', boardSize);

        // Create new cells
        for (let i = 0; i < boardSize * boardSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('data-cell-index', i);

            // Add click event listener
            cell.addEventListener('click', handleCellClick);

            // Add touch event listener with proper handling
            cell.addEventListener('touchend', function(e) {
                e.preventDefault();
                handleCellClick(e);
            });

            // Add the cell to the board
            board.appendChild(cell);
        }

        // Update the cells reference for future use
        const newCells = document.querySelectorAll('.cell');
        cells = newCells;
        console.log(`Created ${cells.length} cells for ${boardSize}x${boardSize} board`);

        // Update winning conditions based on board size
        updateWinningConditions();

        // Reset game state to ensure clean start
        gameActive = true;
        currentPlayer = 'x';
        statusDisplay.textContent = currentPlayerTurn();
    }

    // Update winning conditions based on board size
    function updateWinningConditions() {
        winningConditions = [];

        // Add rows
        for (let i = 0; i < boardSize; i++) {
            const row = [];
            for (let j = 0; j < boardSize; j++) {
                row.push(i * boardSize + j);
            }
            winningConditions.push(row);
        }

        // Add columns
        for (let i = 0; i < boardSize; i++) {
            const col = [];
            for (let j = 0; j < boardSize; j++) {
                col.push(j * boardSize + i);
            }
            winningConditions.push(col);
        }

        // Add diagonals
        const diagonal1 = [];
        const diagonal2 = [];

        for (let i = 0; i < boardSize; i++) {
            diagonal1.push(i * boardSize + i);
            diagonal2.push(i * boardSize + (boardSize - 1 - i));
        }

        winningConditions.push(diagonal1);
        winningConditions.push(diagonal2);
    }

    // Toggle sound
    function toggleSound() {
        soundEnabled = !soundEnabled;

        if (soundEnabled) {
            soundToggle.classList.remove('sound-off');
            soundToggle.classList.add('sound-on');
            soundToggle.querySelector('i').className = 'fas fa-volume-up';

            // Play a short sound to demonstrate current volume
            playSound(moveSound, 1.0);
        } else {
            soundToggle.classList.remove('sound-on');
            soundToggle.classList.add('sound-off');
            soundToggle.querySelector('i').className = 'fas fa-volume-mute';
        }

        saveToLocalStorage();
    }

    // Update volume
    function updateVolume() {
        // Convert slider value (0-100) to volume (0.0-1.0)
        soundVolume = volumeSlider.value / 100;

        // Update icon based on volume level
        if (soundEnabled) {
            if (soundVolume === 0) {
                soundToggle.querySelector('i').className = 'fas fa-volume-off';
            } else if (soundVolume < 0.5) {
                soundToggle.querySelector('i').className = 'fas fa-volume-down';
            } else {
                soundToggle.querySelector('i').className = 'fas fa-volume-up';
            }

            // Play a short sound to demonstrate current volume
            playSound(moveSound, 1.0);
        }

        saveToLocalStorage();
    }

    // Clear game history
    function clearHistory() {
        gameHistory = [];
        renderGameHistory();
        saveToLocalStorage();
    }

    // Modal functions
    function openPersonalizeModal() {
        personalizeModal.classList.add('active');

        // Set current values in the modal
        playerXNameInput.value = playerNames.x;
        playerONameInput.value = playerNames.o;

        // Select the correct marker options
        xMarkerOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.marker === playerMarkers.x);
        });

        oMarkerOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.marker === playerMarkers.o);
        });

        // Select the correct theme option
        themeOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.theme === currentTheme);
        });

        // Select the correct board size option
        boardSizeOptions.forEach(option => {
            option.classList.toggle('selected', parseInt(option.dataset.size) === boardSize);
        });
    }

    function closePersonalizeModal() {
        personalizeModal.classList.remove('active');
    }

    function switchTab(tabName) {
        // Hide all tab contents
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all tab buttons
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });

        // Show the selected tab content
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Add active class to the clicked tab button
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    }

    function savePersonalization() {
        // Save player names
        playerNames.x = playerXNameInput.value || 'Player X';
        playerNames.o = playerONameInput.value || 'Player O';

        // Save player markers
        const selectedXMarker = document.querySelector('#x-marker-options .marker-option.selected');
        const selectedOMarker = document.querySelector('#o-marker-options .marker-option.selected');

        if (selectedXMarker) {
            playerMarkers.x = selectedXMarker.dataset.marker;
        }

        if (selectedOMarker) {
            playerMarkers.o = selectedOMarker.dataset.marker;
        }

        // Save theme
        const selectedTheme = document.querySelector('.theme-option.selected');
        if (selectedTheme) {
            currentTheme = selectedTheme.dataset.theme;
            applyTheme(currentTheme);
        }

        // Save board size
        const selectedBoardSize = document.querySelector('.board-size-option.selected');
        if (selectedBoardSize) {
            const newBoardSize = parseInt(selectedBoardSize.dataset.size);

            // Only update board if size has changed
            if (newBoardSize !== boardSize) {
                boardSize = newBoardSize;
                updateBoardSize();

                // Reset scores and game
                scores = { x: 0, o: 0 };
                updateScoreDisplay();
                handleReset();
            }
        }

        // Update UI
        updatePlayerLabels();
        statusDisplay.textContent = currentPlayerTurn();

        // Save to local storage
        saveToLocalStorage();

        // Close the modal
        closePersonalizeModal();
    }

    // Add event listeners to cells (will be called after board creation)
    function addCellEventListeners() {
        cells.forEach(cell => {
            // Use both click and touchend for better mobile response
            cell.addEventListener('click', handleCellClick);

            // Prevent double-tap zoom on mobile
            cell.addEventListener('touchend', function(e) {
                e.preventDefault();
                handleCellClick(e);
            });
        });
    }

    // Add reset button event listeners with improved handling
    resetButton.addEventListener('click', function() {
        console.log("Reset button clicked");
        handleReset();
    });

    resetButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        console.log("Reset button touched");
        handleReset();
    });

    // Double-check that the reset button is properly initialized
    console.log("Reset button initialized:", resetButton);

    gameModeSelect.addEventListener('change', function() {
        gameMode = this.value;
        updateDifficultyVisibility();
        updatePlayerLabels();
        handleReset();
        saveToLocalStorage();
    });

    difficultySelect.addEventListener('change', function() {
        difficulty = this.value;
        saveToLocalStorage();
    });

    autoRestartToggle.addEventListener('change', function() {
        // Update the auto-restart state
        autoRestartEnabled = this.checked;
        console.log("Auto-restart toggled:", autoRestartEnabled);

        // Save to local storage immediately
        saveToLocalStorage();

        // If auto-restart is disabled, clear any pending auto-restart
        if (!autoRestartEnabled && autoRestartTimeout) {
            clearTimeout(autoRestartTimeout);
            autoRestartTimeout = null;
            statusDisplay.classList.remove('countdown');
            statusDisplay.textContent = gameActive ? currentPlayerTurn() :
                (gameState.includes('') ? winningMessage() : drawMessage());
        }
    });

    // Ensure the toggle is set correctly on page load
    setTimeout(() => {
        autoRestartToggle.checked = autoRestartEnabled;
        console.log("Auto-restart toggle set to:", autoRestartEnabled);
    }, 100);

    // Personalization modal event listeners
    personalizeBtn.addEventListener('click', openPersonalizeModal);
    personalizeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        openPersonalizeModal();
    });

    closeModalBtn.addEventListener('click', closePersonalizeModal);
    closeModalBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        closePersonalizeModal();
    });

    savePersonalizationBtn.addEventListener('click', savePersonalization);
    savePersonalizationBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        savePersonalization();
    });

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });

        btn.addEventListener('touchend', function(e) {
            e.preventDefault();
            switchTab(this.dataset.tab);
        });
    });

    // Marker selection
    xMarkerOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            xMarkerOptions.forEach(opt => opt.classList.remove('selected'));

            // Add selected class to clicked option
            this.classList.add('selected');
        });
    });

    oMarkerOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            oMarkerOptions.forEach(opt => opt.classList.remove('selected'));

            // Add selected class to clicked option
            this.classList.add('selected');
        });
    });

    // Theme selection
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            themeOptions.forEach(opt => opt.classList.remove('selected'));

            // Add selected class to clicked option
            this.classList.add('selected');
        });
    });

    // Board size selection
    boardSizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            boardSizeOptions.forEach(opt => opt.classList.remove('selected'));

            // Add selected class to clicked option
            this.classList.add('selected');
        });
    });

    // Add both click and touch events for better mobile response
    themeToggle.addEventListener('click', toggleTheme);
    themeToggle.addEventListener('touchend', function(e) {
        e.preventDefault();
        toggleTheme();
    });

    soundToggle.addEventListener('click', toggleSound);
    soundToggle.addEventListener('touchend', function(e) {
        e.preventDefault();
        toggleSound();
    });

    // Volume slider event listeners
    volumeSlider.addEventListener('input', updateVolume);
    volumeSlider.addEventListener('change', updateVolume);

    clearHistoryButton.addEventListener('click', clearHistory);
    clearHistoryButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        clearHistory();
    });

    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        // Small delay to allow the browser to complete the orientation change
        setTimeout(function() {
            // Adjust UI based on orientation
            if (window.innerHeight < 500) {
                // Landscape mode on small devices
                document.body.classList.add('landscape-mode');
            } else {
                document.body.classList.remove('landscape-mode');
            }
        }, 200);
    });

    // Check initial orientation
    if (window.innerHeight < 500) {
        document.body.classList.add('landscape-mode');
    }

    // Debug function to check game state
    function debugGameState() {
        console.log("=== GAME STATE DEBUG ===");
        console.log("Board Size:", boardSize);
        console.log("Game Active:", gameActive);
        console.log("Current Player:", currentPlayer);
        console.log("Game State:", gameState);
        console.log("Cells Count:", cells.length);
        console.log("Auto-Restart Enabled:", autoRestartEnabled);
        console.log("Reset Button:", resetButton);
        console.log("========================");
    }

    // Initialize the game
    loadFromLocalStorage();
    updateDifficultyVisibility();
    updatePlayerLabels();

    // Set initial board size attribute
    board.setAttribute('data-size', boardSize);

    // Add event listeners to the initial cells
    addCellEventListeners();

    // Ensure auto-restart toggle is correctly set
    autoRestartToggle.checked = autoRestartEnabled;
    console.log("Initial auto-restart state:", autoRestartEnabled);

    // Debug initial game state
    debugGameState();
});