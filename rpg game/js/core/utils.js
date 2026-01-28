// js/core/utils.js
/**
 * Utility functions for the RPG game
 */

const Utils = {
    // Format number with commas
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    // Generate random number between min and max (inclusive)
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Calculate percentage
    calculatePercentage: function(value, total) {
        return total > 0 ? Math.round((value / total) * 100) : 0;
    },

    // Generate unique ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Debounce function for performance
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Deep clone object
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Check if value is in array
    isInArray: function(value, array) {
        return array.indexOf(value) > -1;
    },

    // Capitalize first letter
    capitalize: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    // Format time in HH:MM:SS
    formatTime: function(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Calculate experience needed for next level
    calculateExpNeeded: function(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    },

    // Chance system (percentage based)
    chance: function(percentage) {
        return Math.random() * 100 < percentage;
    },

    // Weighted random selection
    weightedRandom: function(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item.value;
            }
        }
        
        return items[items.length - 1].value;
    },

    // Save data to localStorage with compression
    saveToStorage: function(key, data) {
        try {
            const compressed = btoa(encodeURIComponent(JSON.stringify(data)));
            localStorage.setItem(key, compressed);
            return true;
        } catch (error) {
            console.error('Failed to save to storage:', error);
            return false;
        }
    },

    // Load data from localStorage with decompression
    loadFromStorage: function(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            
            return JSON.parse(decodeURIComponent(atob(data)));
        } catch (error) {
            console.error('Failed to load from storage:', error);
            return null;
        }
    },

    // Remove data from localStorage
    removeFromStorage: function(key) {
        localStorage.removeItem(key);
    },

    // Check if feature is unlocked
    isFeatureUnlocked: function(feature) {
        const unlocked = this.loadFromStorage('unlockedFeatures') || [];
        return unlocked.includes(feature);
    },

    // Unlock feature
    unlockFeature: function(feature) {
        const unlocked = this.loadFromStorage('unlockedFeatures') || [];
        if (!unlocked.includes(feature)) {
            unlocked.push(feature);
            this.saveToStorage('unlockedFeatures', unlocked);
            return true;
        }
        return false;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}