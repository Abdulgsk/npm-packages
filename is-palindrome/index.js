function isPalindrome(str) {
    if (typeof str !== 'string') {
        throw new TypeError('Input must be a string');
    }

    const cleanedStr = str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const len = cleanedStr.length;
    
    for (let i = 0; i < len / 2; i++) {
        if (cleanedStr[i] !== cleanedStr[len - 1 - i]) {
            return false;
        }
    }
    return true;
}

// Export the function for CommonJS (Node.js)
module.exports = isPalindrome;

// If you want ES Module support (optional)
module.exports.default = isPalindrome;