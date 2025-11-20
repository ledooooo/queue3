// Audio System for Queue Management
class AudioSystem {
    constructor() {
        this.audioType = 'tts'; // 'tts' or 'mp3'
        this.audioSpeed = 1.0;
        this.audioPath = './resources/audio/';
        this.isPlaying = false;
        this.audioQueue = [];
        this.currentAudio = null;
    }

    // Initialize audio system
    async initialize() {
        try {
            const settings = await firebaseUtils.getData('settings');
            if (settings) {
                this.audioType = settings.audioType || 'tts';
                this.audioSpeed = settings.audioSpeed || 1.0;
                this.audioPath = settings.audioPath || './resources/audio/';
            }
            return true;
        } catch (error) {
            console.error('Error initializing audio system:', error);
            return false;
        }
    }

    // Set audio type (tts or mp3)
    setAudioType(type) {
        this.audioType = type;
        firebaseUtils.updateData('settings', { audioType: type });
    }

    // Set audio speed
    setAudioSpeed(speed) {
        this.audioSpeed = speed;
        firebaseUtils.updateData('settings', { audioSpeed: speed });
    }

    // Play queue announcement
    async playQueueAnnouncement(clinicName, number) {
        if (this.isPlaying) {
            this.audioQueue.push({ clinicName, number });
            return;
        }

        this.isPlaying = true;

        if (this.audioType === 'tts') {
            await this.playTTS(clinicName, number);
        } else {
            await this.playMP3(clinicName, number);
        }

        this.isPlaying = false;
        
        // Play next in queue if any
        if (this.audioQueue.length > 0) {
            const next = this.audioQueue.shift();
            setTimeout(() => this.playQueueAnnouncement(next.clinicName, next.number), 1000);
        }
    }

    // Play using Text-to-Speech
    async playTTS(clinicName, number) {
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance();
            
            // Configure Arabic voice
            utterance.lang = 'ar-SA';
            utterance.rate = this.audioSpeed;
            
            // Build the announcement text
            const numberInArabic = this.numberToArabic(number);
            utterance.text = `على العميل رقم ${numberInArabic} التوجه إلى عيادة ${clinicName}`;
            
            utterance.onend = () => {
                setTimeout(resolve, 500);
            };
            
            speechSynthesis.speak(utterance);
        });
    }

    // Play using MP3 files
    async playMP3(clinicName, number) {
        const audioFiles = this.getAudioFilesForNumber(number);
        
        for (let i = 0; i < audioFiles.length; i++) {
            await this.playAudioFile(audioFiles[i]);
            await this.delay(300);
        }
        
        // Play clinic name
        const clinicAudio = `${this.audioPath}clinics/${clinicName}.mp3`;
        await this.playAudioFile(clinicAudio);
    }

    // Get audio files for a number
    getAudioFilesForNumber(number) {
        const files = [];
        
        // Base announcement
        files.push(`${this.audioPath}base/على_العميل_رقم.mp3`);
        
        // Convert number to Arabic words and get corresponding audio files
        const arabicNumber = this.numberToArabic(number);
        const words = arabicNumber.split(' ');
        
        for (const word of words) {
            if (word === 'و') {
                files.push(`${this.audioPath}connectors/و.mp3`);
            } else {
                const numberFile = this.getNumberAudioFile(word);
                if (numberFile) {
                    files.push(numberFile);
                }
            }
        }
        
        return files;
    }

    // Get audio file path for a number word
    getNumberAudioFile(word) {
        const numberMap = {
            'واحد': '1.mp3',
            'اثنان': '2.mp3',
            'ثلاثة': '3.mp3',
            'أربعة': '4.mp3',
            'خمسة': '5.mp3',
            'ستة': '6.mp3',
            'سبعة': '7.mp3',
            'ثمانية': '8.mp3',
            'تسعة': '9.mp3',
            'عشرة': '10.mp3',
            'عشرون': '20.mp3',
            'ثلاثون': '30.mp3',
            'أربعون': '40.mp3',
            'خمسون': '50.mp3',
            'ستون': '60.mp3',
            'سبعون': '70.mp3',
            'ثمانون': '80.mp3',
            'تسعون': '90.mp3',
            'مائة': '100.mp3',
            'مائتان': '200.mp3',
            'ثلاثمائة': '300.mp3',
            'أربعمائة': '400.mp3',
            'خمسمائة': '500.mp3',
            'ستمائة': '600.mp3',
            'سبعمائة': '700.mp3',
            'ثمانمائة': '800.mp3',
            'تسعمائة': '900.mp3'
        };
        
        return numberMap[word] ? `${this.audioPath}numbers/${numberMap[word]}` : null;
    }

    // Convert number to Arabic words
    numberToArabic(num) {
        if (num === 0) return 'صفر';
        if (num === 1) return 'واحد';
        if (num === 2) return 'اثنان';
        if (num === 3) return 'ثلاثة';
        if (num === 4) return 'أربعة';
        if (num === 5) return 'خمسة';
        if (num === 6) return 'ستة';
        if (num === 7) return 'سبعة';
        if (num === 8) return 'ثمانية';
        if (num === 9) return 'تسعة';
        if (num === 10) return 'عشرة';
        
        if (num < 20) {
            const ones = num % 10;
            const onesText = this.numberToArabic(ones);
            return onesText + ' عشر';
        }
        
        if (num < 100) {
            const tens = Math.floor(num / 10) * 10;
            const ones = num % 10;
            
            const tensText = this.getTensText(tens);
            const onesText = ones > 0 ? ' و' + this.numberToArabic(ones) : '';
            
            return tensText + onesText;
        }
        
        if (num < 1000) {
            const hundreds = Math.floor(num / 100) * 100;
            const remainder = num % 100;
            
            const hundredsText = this.getHundredsText(hundreds);
            const remainderText = remainder > 0 ? ' و' + this.numberToArabic(remainder) : '';
            
            return hundredsText + remainderText;
        }
        
        return num.toString();
    }

    getTensText(num) {
        const tensMap = {
            20: 'عشرون',
            30: 'ثلاثون',
            40: 'أربعون',
            50: 'خمسون',
            60: 'ستون',
            70: 'سبعون',
            80: 'ثمانون',
            90: 'تسعون'
        };
        return tensMap[num] || num.toString();
    }

    getHundredsText(num) {
        const hundredsMap = {
            100: 'مائة',
            200: 'مائتان',
            300: 'ثلاثمائة',
            400: 'أربعمائة',
            500: 'خمسمائة',
            600: 'ستمائة',
            700: 'سبعمائة',
            800: 'ثمانمائة',
            900: 'تسعمائة'
        };
        return hundredsMap[num] || num.toString();
    }

    // Play individual audio file
    playAudioFile(src) {
        return new Promise((resolve) => {
            const audio = new Audio(src);
            audio.playbackRate = this.audioSpeed;
            
            audio.onended = () => {
                setTimeout(resolve, 200);
            };
            
            audio.onerror = () => {
                console.error('Error playing audio file:', src);
                resolve();
            };
            
            audio.play().catch(() => {
                console.error('Error playing audio file:', src);
                resolve();
            });
            
            this.currentAudio = audio;
        });
    }

    // Delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Stop current audio
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        this.isPlaying = false;
        this.audioQueue = [];
    }

    // Generate audio files for numbers (for development)
    async generateNumberAudioFiles() {
        const numbers = [
            { num: 1, text: 'واحد' },
            { num: 2, text: 'اثنان' },
            { num: 3, text: 'ثلاثة' },
            { num: 4, text: 'أربعة' },
            { num: 5, text: 'خمسة' },
            { num: 6, text: 'ستة' },
            { num: 7, text: 'سبعة' },
            { num: 8, text: 'ثمانية' },
            { num: 9, text: 'تسعة' },
            { num: 10, text: 'عشرة' },
            { num: 20, text: 'عشرون' },
            { num: 30, text: 'ثلاثون' },
            { num: 40, text: 'أربعون' },
            { num: 50, text: 'خمسون' },
            { num: 60, text: 'ستون' },
            { num: 70, text: 'سبعون' },
            { num: 80, text: 'ثمانون' },
            { num: 90, text: 'تسعون' },
            { num: 100, text: 'مائة' },
            { num: 200, text: 'مائتان' },
            { num: 300, text: 'ثلاثمائة' },
            { num: 400, text: 'أربعمائة' },
            { num: 500, text: 'خمسمائة' },
            { num: 600, text: 'ستمائة' },
            { num: 700, text: 'سبعمائة' },
            { num: 800, text: 'ثمانمائة' },
            { num: 900, text: 'تسعمائة' }
        ];

        console.log('Note: Audio files need to be generated and placed in resources/audio/');
        console.log('Required files:');
        numbers.forEach(n => {
            console.log(`- resources/audio/numbers/${n.num}.mp3: "${n.text}"`);
        });
        console.log('- resources/audio/connectors/و.mp3: "و"');
        console.log('- resources/audio/base/على_العميل_رقم.mp3: "على العميل رقم"');
        console.log('- resources/audio/clinics/[clinic_name].mp3 for each clinic');
    }
}

// Initialize audio system
const audioSystem = new AudioSystem();