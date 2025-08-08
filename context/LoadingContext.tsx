import React, { createContext, useCallback, useContext, useState } from 'react';

interface LoadingState {
    isLoading: boolean;
    message: string;
    progress?: number;
}

interface LoadingContextType {
    loadingState: LoadingState;
    showLoading: (message?: string) => void;
    hideLoading: () => void;
    updateMessage: (message: string) => void;
    updateProgress: (progress: number) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

const initialLoadingState: LoadingState = {
    isLoading: false,
    message: 'Yükleniyor...',
    progress: undefined,
};

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [loadingState, setLoadingState] = useState<LoadingState>(initialLoadingState);

    const showLoading = useCallback((message: string = 'Yükleniyor...') => {
        setLoadingState({
            isLoading: true,
            message,
            progress: undefined,
        });
    }, []);

    const hideLoading = useCallback(() => {
        setLoadingState(initialLoadingState);
    }, []);

    const updateMessage = useCallback((message: string) => {
        setLoadingState(prev => ({
            ...prev,
            message,
        }));
    }, []);

    const updateProgress = useCallback((progress: number) => {
        setLoadingState(prev => ({
            ...prev,
            progress,
        }));
    }, []);

    const value: LoadingContextType = {
        loadingState,
        showLoading,
        hideLoading,
        updateMessage,
        updateProgress,
    };

    return (
        <LoadingContext.Provider value={value}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
