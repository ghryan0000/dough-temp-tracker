import { useState, useEffect, useCallback } from 'react';
import { VoiceInputState } from './useVoiceInput';
import { NativeModules, Platform } from 'react-native';

// Safely attempt to import Voice
let Voice: any = null;
try {
    // We check native module existence before using the library to avoid "Invariant Violation"
    if (NativeModules.Voice) {
        Voice = require('@react-native-voice/voice').default;
    }
} catch (e) {
    console.warn('Voice module not available');
}

export const useVoiceInput = (): VoiceInputState => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if (!Voice) {
            setError('Voice not supported in Expo Go. Use Dev Build.');
            setIsSupported(false);
            return;
        }

        setIsSupported(true);

        function onSpeechStart(e: any) {
            setIsListening(true);
            setError(null);
        }

        function onSpeechEnd(e: any) {
            setIsListening(false);
        }

        function onSpeechError(e: any) {
            setError(e.error?.message || 'Unknown error');
            setIsListening(false);
        }

        function onSpeechResults(e: any) {
            if (e.value && e.value[0]) {
                setTranscript(e.value[0]);
            }
        }

        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechResults = onSpeechResults;

        return () => {
            try {
                Voice.destroy().then(Voice.removeAllListeners);
            } catch (e) {
                // Ignore destroy errors
            }
        };
    }, []);

    const startListening = useCallback(async () => {
        if (!Voice) return;
        try {
            setTranscript('');
            await Voice.start('en-US');
        } catch (e) {
            console.error(e);
            setError('Failed to start');
        }
    }, []);

    const stopListening = useCallback(async () => {
        if (!Voice) return;
        try {
            await Voice.stop();
        } catch (e) {
            console.error(e);
        }
    }, []);

    const reset = useCallback(() => {
        setTranscript('');
        setError(null);
    }, []);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        reset,
        isSupported
    };
};
