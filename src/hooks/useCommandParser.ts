import { useState, useCallback } from 'react';

type ParsedCommand = {
    field: string | null;
    value: string | null;
    original: string;
};

// Maps spoken keywords to state keys
const KEYWORD_MAP: Record<string, string> = {
    'room': 'roomTemp',
    'ambient': 'roomTemp',
    'flour': 'flourTemp',
    'water': 'waterTemp',
    'levain': 'levainTemp',
    'starter': 'levainTemp',
    'final': 'finalTemp',
    'dough': 'finalTemp',
    'mix': 'mixTime',
    'mixing': 'mixTime',
    'hydration': 'hydration',
    'hydro': 'hydration',
    'target': 'target',
    'goal': 'target'
};

export const useCommandParser = () => {
    const [lastCommand, setLastCommand] = useState<ParsedCommand | null>(null);

    const parseCommand = useCallback((transcript: string): ParsedCommand | null => {
        const lower = transcript.toLowerCase();

        // 1. Identify valid keywords
        const foundKeyword = Object.keys(KEYWORD_MAP).find(k => lower.includes(k));

        if (!foundKeyword) {
            return null;
        }

        // 2. Extract numbers
        // Matches "25", "25.5", "point 5" (which might be speech-to-text artifact)
        const numberMatch = lower.match(/(\d+(\.\d+)?)/);

        if (!numberMatch) {
            return null;
        }

        const field = KEYWORD_MAP[foundKeyword];
        const value = numberMatch[0];

        const result = {
            field,
            value,
            original: transcript
        };

        setLastCommand(result);
        return result;
    }, []);

    return { parseCommand, lastCommand };
};
