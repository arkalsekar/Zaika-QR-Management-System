import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const Scanner = ({ onScan }) => {
    const scannerRef = useRef(null);
    const onScanRef = useRef(onScan);

    // Keep the callback fresh without re-running the effect
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        const scannerId = "html5qr-code-full-region";

        // 1. Force cleanup of any existing DOM elements from previous runs
        const container = document.getElementById(scannerId);
        if (container) {
            container.innerHTML = "";
        }

        // 2. Small delay to ensure DOM is ready and previous cleanup acts
        const timer = setTimeout(() => {
            // Double check if component is still successfully mounted
            if (!container) return;

            try {
                const scanner = new Html5QrcodeScanner(
                    scannerId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true,
                        rememberLastUsedCamera: true
                    },
                    /* verbose= */ false
                );

                scannerRef.current = scanner;

                scanner.render(
                    (decodedText) => {
                        // Prevent multiple triggers
                        if (onScanRef.current) {
                            onScanRef.current(decodedText);
                            // Optional: pause immediately to prevent read-after-read
                            scanner.pause();
                        }
                    },
                    (errorMessage) => {
                        // error is ignorable
                    }
                );
            } catch (e) {
                console.error("Scanner init error", e);
            }
        }, 100);

        // Cleanup function
        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(err => console.warn("Clear error", err));
                } catch (e) {
                    console.warn("Scanner ref clear error", e);
                }
                scannerRef.current = null;
            }
        };
    }, []);

    return (
        <div id="html5qr-code-full-region" style={{ width: '100%' }}></div>
    );
};

export default Scanner;
