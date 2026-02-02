import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceButtonProps {
    isListening: boolean;
    onToggle: () => void;
    isProcessing?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ isListening, onToggle, isProcessing }) => {
    return (
        <button
            onClick={onToggle}
            className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 z-50 ${isListening
                    ? 'bg-apple-red text-white scale-110 ring-4 ring-red-100 animate-pulse'
                    : 'bg-white text-apple-gray hover:text-apple-red'
                } border-2 border-apple-red/10`}
            aria-label={isListening ? 'Stop Voice Activation' : 'Start Voice Activation'}
        >
            {isProcessing ? (
                <Loader2 size={24} className="animate-spin" />
            ) : isListening ? (
                <Mic size={24} />
            ) : (
                <MicOff size={24} />
            )}

            {isListening && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
            )}
        </button>
    );
};
