class PomodoroTimerService {
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
        this.listeners = [];
    }
    
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }
    
    notifyListeners() {
        this.listeners.forEach(callback => callback({
            currentTime: this.currentTime,
            isRunning: this.isRunning,
            isBreak: this.isBreak,
            currentSession: this.currentSession,
            sessionType: this.getSessionType()
        }));
    }
    
    getSessionType() {
        if (this.isBreak) {
            return this.currentSession === this.maxSessions ? 'LONG BREAK' : 'BREAK';
        }
        return 'FOCUS';
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
        this.notifyListeners();
        
        this.timer = setInterval(() => {
            this.currentTime--;
            this.notifyListeners();
            
            if (this.currentTime <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.notifyListeners();
        clearInterval(this.timer);
    }
    
    async completeSession() {
        this.pauseTimer();
        await this.playNotificationSound();
        await this.scheduleNotification();
        
        if (this.isBreak) {
            this.isBreak = false;
            this.currentSession++;
            
            if (this.currentSession > this.maxSessions) {
                this.currentSession = 1;
            }
            
            this.currentTime = this.workDuration;
        } else {
            this.isBreak = true;
            
            if (this.currentSession === this.maxSessions) {
                this.currentTime = this.longBreakDuration;
            } else {
                this.currentTime = this.breakDuration;
            }
        }
        
        this.notifyListeners();
        
        setTimeout(() => {
            if (!this.isRunning) {
                this.startTimer();
            }
        }, 3000);
    }
    
    async playNotificationSound() {
        try {
            const { Audio } = require('expo-av');
            
            console.log('Playing notification sound for session transition');
        } catch (error) {
            console.log('Session completed!', error);
        }
    }
    
    async scheduleNotification() {
        try {
            const Notifications = require('expo-notifications');
            
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: this.isBreak ? 'Break Time!' : 'Focus Time!',
                    body: this.isBreak ? 'Time for a break' : 'Time to focus',
                    sound: true,
                },
                trigger: null, // Show immediately
            });
        } catch (error) {
            console.log('Notification error:', error);
        }
    }
    
    formatTime() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

export default PomodoroTimerService;
