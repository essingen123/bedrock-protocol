
import React, { useState, useCallback } from 'react';

interface DropZoneProps {
    onDropFiles: (files: FileList) => void;
    children: React.ReactNode;
    className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({ onDropFiles, children, className = '' }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onDropFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }, [onDropFiles]);

    const baseClasses = 'border-2 border-dashed border-gray-600 rounded-lg cursor-pointer transition-colors duration-200';
    const dragOverClasses = isDragOver ? 'bg-gray-700 border-teal-400' : '';

    return (
        <div
            className={`${baseClasses} ${dragOverClasses} ${className}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {children}
        </div>
    );
};
