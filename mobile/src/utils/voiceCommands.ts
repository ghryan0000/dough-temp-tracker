export type VoiceCommand = {
    field: string;
    value: number;
};

const FIELD_MAPPINGS: Record<string, string[]> = {
    roomTemp: ['room', 'room temperature', 'ambient', 'room temp'],
    flourTemp: ['flour', 'flour temperature', 'flour temp'],
    levainTemp: ['levain', 'starter', 'levain temperature', 'levain temp'],
    waterTemp: ['water', 'actual water', 'water temperature', 'water temp'],
    finalTemp: ['final', 'dough', 'final temperature', 'final temp', 'fd temp'],
    mixTime: ['mix', 'mixing', 'mix time', 'mixing time'],
    hydration: ['hydration', 'water percent', 'hydration percentage'],
    target: ['target', 'target temperature', 'goal'],
};

const WAKE_WORD = 'hey baker';

export const isWakeWord = (text: string): boolean => {
    return text.toLowerCase().includes(WAKE_WORD);
};

export const parseVoiceCommand = (text: string): VoiceCommand | null => {
    const normalized = text.toLowerCase();

    // Extract number
    const numberMatch = normalized.match(/(\d+(\.\d+)?)/);
    if (!numberMatch) return null;

    const value = parseFloat(numberMatch[1]);

    // Identify field
    for (const [field, keywords] of Object.entries(FIELD_MAPPINGS)) {
        if (keywords.some(keyword => normalized.includes(keyword))) {
            return { field, value };
        }
    }

    return null;
};
