import { useState, useCallback, useRef, useEffect } from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { isWakeWord, parseVoiceCommand, VoiceCommand } from '../utils/voiceCommands';

// For Mobile, we'll need conditional import or check
let Voice: any = null;
try {
    // @ts-ignore
    Voice = require('@react-native-voice/voice').default;
} catch (e) {
    // Not in native environment
}

interface UseVoiceRecognitionReturn {
    isListening: boolean;
    startListening: () => void;
    stopListening: () => void;
    error: string | null;
    lastCommand: VoiceCommand | null;
    transcript: string;
}

export const useVoiceRecognition = (onCommand?: (command: VoiceCommand) => void): UseVoiceRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
    const [transcript, setTranscript] = useState('');

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Speech recognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                currentTranscript += event.results[i][0].transcript;
            }

            setTranscript(currentTranscript);

            // Check for wake word
            if (isWakeWord(currentTranscript)) {
                // Parse for command after wake word
                const command = parseVoiceCommand(currentTranscript);
                if (command) {
                    setLastCommand(command);
                    if (onCommand) onCommand(command);
                    // Optional: Clear transcript after successful command to avoid double-triggering
                    // setTranscript('');
                }
            }
        };

        recognition.onerror = (event: any) => {
            setError(event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            if (isListening) {
                recognition.start(); // Keep listening if we're supposed to be
            }
        };

        recognitionRef.current = recognition;
    }, [onCommand, isListening]);

    // Handle Native (Mobile)
    useEffect(() => {
        if (!Voice) return;

        const onSpeechResults = (e: any) => {
            if (e.value && e.value.length > 0) {
                const currentTranscript = e.value[0];
                setTranscript(currentTranscript);

                if (isWakeWord(currentTranscript)) {
                    const command = parseVoiceCommand(currentTranscript);
                    if (command) {
                        setLastCommand(command);
                        if (onCommand) onCommand(command);
                    }
                }
            }
        };

        const onSpeechError = (e: any) => {
            setError(e.error?.message || 'Unknown voice error');
            setIsListening(false);
        };

        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, [onCommand]);

    const startListening = useCallback(async () => {
        setError(null);
        setIsListening(true);

        if (Voice) {
            try {
                await Voice.start('en-US');
            } catch (e: any) {
                setError(e.message);
                setIsListening(false);
            }
        } else if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                // Recognition already started
            }
        }
    }, []);

    const stopListening = useCallback(async () => {
        setIsListening(false);
        if (Voice) {
            try {
                await Voice.stop();
            } catch (e) { }
        } else if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return {
        isListening,
        startListening,
        stopListening,
        error,
        lastCommand,
        transcript
    };
};
