class PomodoroTimer {
    constructor() {
        this.workDuration = 25 * 60; // 25 minutes in seconds
        this.breakDuration = 5 * 60; // 5 minutes in seconds
        this.longBreakDuration = 15 * 60; // 15 minutes in seconds
        
        this.currentTime = this.workDuration;
        this.isRunning = false;
        this.isBreak = false;
        this.currentSession = 1;
        this.maxSessions = 4;
        
        this.timer = null;
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.timeDisplay = document.getElementById('timeDisplay');
        this.sessionType = document.getElementById('sessionType');
        this.startBtn = document.getElementById('startBtn');
        this.sessionIndicator = document.getElementById('sessionIndicator');
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.toggleTimer());
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleTimer();
            }
        });
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.startBtn.textContent = 'PAUSE';
        this.startBtn.classList.add('running');
        
        this.timer = setInterval(() => {
            this.currentTime--;
            this.updateDisplay();
            
            if (this.currentTime <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.startBtn.textContent = 'START';
        this.startBtn.classList.remove('running');
        clearInterval(this.timer);
    }
    
    completeSession() {
        this.pauseTimer();
        this.playNotificationSound();
        
        if (this.isBreak) {
            this.isBreak = false;
            this.currentSession++;
            
            if (this.currentSession > this.maxSessions) {
                this.currentSession = 1;
            }
            
            this.currentTime = this.workDuration;
            document.body.classList.remove('break-mode');
        } else {
            this.isBreak = true;
            
            if (this.currentSession === this.maxSessions) {
                this.currentTime = this.longBreakDuration;
            } else {
                this.currentTime = this.breakDuration;
            }
            
            document.body.classList.add('break-mode');
        }
        
        this.updateDisplay();
        this.updateSessionIndicator();
        
        setTimeout(() => {
            if (!this.isRunning) {
                this.startTimer();
            }
        }, 3000);
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        
        this.timeDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.isBreak) {
            if (this.currentSession === this.maxSessions) {
                this.sessionType.textContent = 'LONG BREAK';
            } else {
                this.sessionType.textContent = 'BREAK';
            }
        } else {
            this.sessionType.textContent = 'FOCUS';
        }
        
        document.title = `${this.timeDisplay.textContent} - PomodoroFlow`;
    }
    
    updateSessionIndicator() {
        const dots = this.sessionIndicator.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            if (index < this.currentSession && !this.isBreak) {
                dot.classList.add('active');
            } else if (index === this.currentSession - 1 && !this.isBreak) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Session completed!');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
