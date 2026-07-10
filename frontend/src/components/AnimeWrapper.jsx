import React, { useEffect, useRef } from 'react';
import * as animeModule from 'animejs';

const AnimeWrapper = ({ children, triggerKey }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let animeEngine = animeModule.default || animeModule;

        // Find all elements to animate
        const items = containerRef.current.querySelectorAll('.animate-item');
        
        // Safety Fallback: If no child elements have the animate-item class yet, 
        // make sure we don't block the screen
        if (items.length === 0) {
            return;
        }

        // Fire the timeline layout cleanly
        animeEngine({
            targets: items,
            opacity: [0, 1],
            translateY: [16, 0],
            scale: [0.99, 1],
            delay: animeEngine.stagger(40, { start: 30 }),
            duration: 500,
            easing: 'cubicBezier(0.25, 1, 0.5, 1)'
        });
    }, [triggerKey]);

    return (
        // Adding animate-item here guarantees the wrapper itself is always visible
        <div ref={containerRef} className="space-y-6 animate-item w-full flex-1">
            {children}
        </div>
    );
};

export default AnimeWrapper;