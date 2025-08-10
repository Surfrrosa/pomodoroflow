import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const STORAGE_KEY = 'pomodoroflow_state';

class PomodoroTimerService {
    constructor() {
        this.workDuration = 25 * 60; // 25 minutes in seconds
        this.breakDuration = 5 * 60; // 5 minutes in seconds
        this.longBreakDuration = 15 * 60; // 15 minutes in seconds
        
        this.devWorkDuration = 25; // 25 seconds
        this.devBreakDuration = 5; // 5 seconds
        
        this.currentTime = this.workDuration;
        this.isRunning = false;
        this.isBreak = false;
        this.currentSession = 1;
        this.maxSessions = 4;
        this.devFastMode = true; // Default to dev mode for testing
        
        this.timer = null;
        this.listeners = [];
        this.notificationId = null;
        this.phaseEndAt = null;
        this.sound = null;
        
        this.initializeAudio();
        this.loadState();
    }
    
    async initializeAudio() {
        try {
            await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
            const { sound } = await Audio.Sound.createAsync(
                require('../assets/chime.mp3'),
                { shouldPlay: false }
            );
            this.sound = sound;
        } catch (e) {
            console.warn('Chime not loaded, continuing without audio:', e?.message);
            this.sound = null;
        }
    }

    async loadState() {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const { phase, phaseStartAt, phaseEndAt } = JSON.parse(stored);
                const now = Date.now();
                
                if (phaseEndAt && now < phaseEndAt) {
                    this.isBreak = phase === 'break';
                    this.phaseEndAt = phaseEndAt;
                    this.currentTime = Math.max(0, Math.floor((phaseEndAt - now) / 1000));
                    this.isRunning = true;
                    this.startTimer();
                } else if (phaseEndAt && now >= phaseEndAt) {
                    this.handlePhaseTransition();
                }
            }
        } catch (e) {
            console.warn('Failed to load state:', e);
        }
    }

    async saveState() {
        try {
            const state = {
                phase: this.isBreak ? 'break' : 'focus',
                phaseStartAt: Date.now(),
                phaseEndAt: this.phaseEndAt,
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save state:', e);
        }
    }

    async clearState() {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear state:', e);
        }
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
            sessionType: this.getSessionType(),
            devFastMode: this.devFastMode
        }));
    }
    
    getSessionType() {
        if (this.isBreak) {
            return this.currentSession === this.maxSessions ? 'LONG BREAK' : 'BREAK';
        }
        return 'FOCUS';
    }
    
    getDuration(type) {
        if (this.devFastMode) {
            return type === 'work' ? this.devWorkDuration : this.devBreakDuration;
        }
        return type === 'work' ? this.workDuration : this.breakDuration;
    }

    toggleDevFastMode() {
        this.devFastMode = !this.devFastMode;
        if (!this.isRunning) {
            this.currentTime = this.getDuration(this.isBreak ? 'break' : 'work');
        }
        this.notifyListeners();
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        if (!this.phaseEndAt) {
            const duration = this.getDuration(this.isBreak ? 'break' : 'work');
            this.phaseEndAt = Date.now() + duration * 1000;
            this.currentTime = duration;
        }
        
        this.isRunning = true;
        this.saveState();
        this.scheduleNotification();
        this.notifyListeners();
        
        this.timer = setInterval(() => {
            const now = Date.now();
            this.currentTime = Math.max(0, Math.floor((this.phaseEndAt - now) / 1000));
            this.notifyListeners();
            
            if (this.currentTime <= 0) {
                this.handlePhaseTransition();
            }
        }, 200);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.cancelNotification();
        this.notifyListeners();
        clearInterval(this.timer);
    }

    stopTimer() {
        this.isRunning = false;
        this.isBreak = false;
        this.currentSession = 1;
        this.currentTime = this.getDuration('work');
        this.phaseEndAt = null;
        
        this.cancelNotification();
        this.clearState();
        this.notifyListeners();
        clearInterval(this.timer);
    }
    
    async handlePhaseTransition() {
        clearInterval(this.timer);
        
        await this.playChime();
        await this.triggerHaptic();
        
        if (this.isBreak) {
            this.isBreak = false;
            this.currentSession++;
            
            if (this.currentSession > this.maxSessions) {
                this.currentSession = 1;
            }
            
            this.currentTime = this.getDuration('work');
        } else {
            this.isBreak = true;
            this.currentTime = this.getDuration('break');
        }
        
        this.phaseEndAt = Date.now() + this.currentTime * 1000;
        this.saveState();
        this.scheduleNotification();
        this.notifyListeners();
        
        setTimeout(() => {
            if (!this.isRunning) {
                this.startTimer();
            }
        }, 3000);
    }
    
    async playChime() {
        try {
            if (this.sound) {
                await this.sound.replayAsync();
            }
        } catch (e) {
            console.warn('Failed to play chime:', e?.message);
        }
    }
    
    async triggerHaptic() {
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            console.warn('Failed to trigger haptic:', e?.message);
        }
    }

    async cancelNotification() {
        if (this.notificationId) {
            try {
                await Notifications.cancelScheduledNotificationAsync(this.notificationId);
                this.notificationId = null;
            } catch (e) {
                console.warn('Failed to cancel notification:', e);
            }
        }
    }
    
    async scheduleNotification() {
        try {
            await this.cancelNotification();
            
            const trigger = new Date(this.phaseEndAt);
            const nextPhase = this.isBreak ? 'focus' : 'break';
            
            this.notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: nextPhase === 'focus' ? 'Focus time!' : 'Break time!',
                    body: nextPhase === 'focus' ? 'Time to focus' : 'Time for a break',
                    sound: true,
                },
                trigger,
            });
        } catch (e) {
            console.warn('Failed to schedule notification:', e);
        }
    }
    
    formatTime() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

export default PomodoroTimerService;
